/**
 * Tenant entitlements — the one place that answers "may this tenant do X?".
 *
 * Nothing else in the codebase should reason about packages. Controllers and
 * middleware ask for a feature KEY; this module works out the answer from the
 * tenant's package, its per-tenant overrides and its account status.
 *
 * Resolution order (later steps win):
 *   1. Tenant gate     — inactive or suspended tenants are denied everything.
 *   2. Free features   — `features.is_paid = 0` is always granted.
 *   3. Package         — `plan_features` of the tenant's active/trial subscription
 *                        (falling back to `tenants.plan_id`).
 *   4. Overrides       — `tenant_features.is_enabled` 1 grants, 0 revokes.
 *
 * Limits resolve as: tenant override -> plan_features.feature_limit -> the legacy
 * `plans.max_vendors` / `max_orders_per_month` columns, so packages built before
 * per-feature limits existed still cap correctly.
 *
 * Usage from a controller (callback style, matching the rest of the codebase):
 *
 *     var ent = require(appRoot + '/utils/entitlements');
 *     ent.hasFeature(req.admin.tenant_id, 'VENDOR_SETTLEMENTS', function (err, ok) {
 *         if (err) return res.json({ status: 500, message: 'Internal server error' });
 *         if (!ok) return res.json({ status: 403, message: 'Not included in your plan' });
 *         ...
 *     });
 *
 * To guard a whole route, prefer the `requireFeature` middleware.
 */

var sqldb = require('../config/dbconnect');
var dbutil = require('./dbutils');

function query(sql, params, ctx) {
    return new Promise(function (resolve, reject) {
        dbutil.sqlinjection(sqldb.MySQLConPool, sql, params || [], ctx || 'entitlements', function (err, rows) {
            if (err) reject(err); else resolve(rows || []);
        });
    });
}

// ---------------------------------------------------------------------------
// Cache
//
// Entitlements change rarely but are read on nearly every request, so they are
// held briefly in process. Any write that could change an answer must call
// `invalidate()` — see the Super Admin plan/feature/tenant controllers.
// ---------------------------------------------------------------------------
var TTL_MS = 60 * 1000;
var cache = Object.create(null);

function cacheGet(tenantId) {
    var hit = cache[tenantId];
    if (!hit) return null;
    if (Date.now() - hit.at > TTL_MS) { delete cache[tenantId]; return null; }
    return hit.value;
}

function cacheSet(tenantId, value) {
    cache[tenantId] = { at: Date.now(), value: value };
}

/** Drops one tenant's cached entitlements, or everyone's when called bare. */
function invalidate(tenantId) {
    if (tenantId === undefined || tenantId === null) cache = Object.create(null);
    else delete cache[tenantId];
}

// ---------------------------------------------------------------------------
// Kill switch
//
// Read per resolve (and cached with the result) so enforcement can be disabled
// from the database without a redeploy if a mis-seeded package locks tenants out.
// ---------------------------------------------------------------------------
async function enforcementEnabled() {
    var rows = await query("SELECT setting_value FROM platform_settings WHERE setting_key = 'entitlements_enforced' LIMIT 1", [], 'ent-killswitch');
    if (!rows.length) return true; // absent = enforce, so a missing row fails safe
    return String(rows[0].setting_value) === '1';
}

// Features whose cap lived on `plans` before per-feature limits existed.
var LEGACY_PLAN_LIMITS = { VENDORS: 'max_vendors', ORDERS: 'max_orders_per_month' };

/**
 * Builds the full entitlement picture for a tenant.
 * Shape: { tenant_id, enforced, blocked, blocked_reason, plan_id, plan_code,
 *          features: { KEY: {...} }, keys: [...], limits: { KEY: n|null },
 *          applications: [...] }
 */
async function resolve(tenantId) {
    var id = Number(tenantId);
    if (!id) {
        return { tenant_id: null, enforced: true, blocked: true, blocked_reason: 'No tenant on the request', plan_id: null, plan_code: null, features: {}, keys: [], limits: {}, applications: [] };
    }

    var enforced = await enforcementEnabled();

    var tenantRows = await query(
        "SELECT t.id, t.active_status, t.onboarding_status, t.plan_id AS tenant_plan_id, " +
        "  (SELECT s.plan_id FROM tenant_subscriptions s WHERE s.tenant_id = t.id AND IFNULL(s.d_in,0) = 0 AND s.status IN (0,1) ORDER BY s.id DESC LIMIT 1) AS sub_plan_id " +
        "FROM tenants t WHERE t.id = ? AND IFNULL(t.d_in,0) = 0", [id], 'ent-tenant');

    if (!tenantRows.length) {
        return { tenant_id: id, enforced: enforced, blocked: true, blocked_reason: 'Tenant not found', plan_id: null, plan_code: null, features: {}, keys: [], limits: {}, applications: [] };
    }

    var tenant = tenantRows[0];
    // The active subscription is authoritative; tenants.plan_id is the fallback for
    // tenants created with a package but no subscription row.
    var planId = tenant.sub_plan_id || tenant.tenant_plan_id || 0;

    var blocked = false, reason = null;
    if (Number(tenant.active_status) === 0) { blocked = true; reason = 'This account is inactive'; }
    else if (Number(tenant.onboarding_status) === 3) { blocked = true; reason = 'This account is suspended'; }

    var planRows = planId ? await query("SELECT plan_code, max_vendors, max_orders_per_month FROM plans WHERE id = ? AND IFNULL(d_in,0) = 0", [planId], 'ent-plan') : [];
    var plan = planRows[0] || {};

    // `in_plan` is asked for explicitly: a plan_features row may legitimately carry
    // a NULL feature_limit ("unlimited"), so membership cannot be inferred from the
    // limit being non-null.
    var rows = await query(
        "SELECT f.id, f.feature_key, f.feature_name, f.module, f.is_paid, f.is_implemented, f.limit_unit, " +
        "  pf.id IS NOT NULL AS in_plan, pf.feature_limit AS plan_limit, " +
        "  tf.is_enabled AS override_enabled, tf.limit_value AS override_limit " +
        "FROM features f " +
        "LEFT JOIN plan_features pf ON pf.feature_id = f.id AND IFNULL(pf.d_in,0) = 0 AND pf.plan_id = ? " +
        "LEFT JOIN tenant_features tf ON tf.feature_id = f.id AND tf.tenant_id = ? AND IFNULL(tf.d_in,0) = 0 " +
        "WHERE IFNULL(f.d_in,0) = 0 AND f.is_active = 1 ORDER BY f.sort_order, f.feature_key",
        [planId, id], 'ent-features');

    var features = {}, keys = [], limits = {}, apps = {};

    rows.forEach(function (r) {
        var free = Number(r.is_paid) === 0;
        var override = r.override_enabled === null || r.override_enabled === undefined ? null : Number(r.override_enabled);

        var granted;
        if (override === 1) granted = true;                    // granted beyond the package
        else if (override === 0) granted = free;               // revoked, unless it is free
        else granted = free || Number(r.in_plan) === 1;        // whatever the package says
        // An inactive or suspended tenant loses everything while enforcement is on.
        if (blocked && enforced) granted = false;

        var raw = r.override_limit !== null && r.override_limit !== undefined ? r.override_limit
            : (r.plan_limit !== null && r.plan_limit !== undefined ? r.plan_limit
                : (LEGACY_PLAN_LIMITS[r.feature_key] ? plan[LEGACY_PLAN_LIMITS[r.feature_key]] : null));
        var limit = parseLimit(raw);

        features[r.feature_key] = {
            key: r.feature_key,
            name: r.feature_name,
            application: r.application,
            module: r.module,
            is_paid: free ? 0 : 1,
            is_implemented: Number(r.is_implemented) === 1,
            granted: granted,
            limit: limit,
            limit_unit: r.limit_unit || null,
            source: override === null ? 'plan' : 'override'
        };
        limits[r.feature_key] = limit;

        if (granted) {
            keys.push(r.feature_key);
            if (r.application) apps[r.application] = true;
        }
    });

    var result = {
        tenant_id: id,
        enforced: enforced,
        blocked: blocked,
        blocked_reason: reason,
        plan_id: planId || null,
        plan_code: plan.plan_code || null,
        features: features,
        keys: keys,
        limits: limits,
        applications: Object.keys(apps)
    };
    cacheSet(id, result);
    return result;
}

function parseLimit(raw) {
    if (raw === null || raw === undefined || raw === '') return null;      // null = unlimited
    var text = String(raw).trim().toLowerCase();
    if (text === 'unlimited' || text === 'null' || text === '-') return null;
    var n = parseInt(text, 10);
    return isNaN(n) ? null : n;
}

async function getResolved(tenantId) {
    var cached = cacheGet(Number(tenantId));
    if (cached) return cached;
    return await resolve(tenantId);
}

// ---------------------------------------------------------------------------
// Public API — promise and callback forms of each
// ---------------------------------------------------------------------------

/** The resolved entitlement object for a tenant. */
function getTenantEntitlements(tenantId, callback) {
    return adapt(getResolved(tenantId), callback);
}

/** Just the granted feature keys, which is what frontends consume. */
function getTenantFeatures(tenantId, callback) {
    return adapt(getResolved(tenantId).then(function (e) { return e.keys; }), callback);
}

/** True when the tenant may use `featureKey`. */
function hasFeature(tenantId, featureKey, callback) {
    return adapt(getResolved(tenantId).then(function (e) {
        var f = e.features[featureKey];
        return !!(f && f.granted);
    }), callback);
}

/** The numeric cap for a feature, or null for unlimited / not applicable. */
function getFeatureLimit(tenantId, featureKey, callback) {
    return adapt(getResolved(tenantId).then(function (e) {
        return e.limits[featureKey] === undefined ? null : e.limits[featureKey];
    }), callback);
}

/** Which applications the tenant has any granted feature for. */
function getTenantApplications(tenantId, callback) {
    return adapt(getResolved(tenantId).then(function (e) { return e.applications; }), callback);
}

/**
 * The full verdict for one feature, for callers that want to explain the refusal:
 * { allowed, status, message, limit }.
 */
function validateFeatureAccess(tenantId, featureKey, callback) {
    return adapt(getResolved(tenantId).then(function (e) {
        if (!e.enforced) return { allowed: true, status: 200, message: null, limit: e.limits[featureKey] ?? null };
        if (e.blocked) return { allowed: false, status: 403, message: e.blocked_reason || 'Account unavailable', limit: null };
        var f = e.features[featureKey];
        if (!f) return { allowed: false, status: 403, message: 'Unknown feature: ' + featureKey, limit: null };
        if (!f.granted) return { allowed: false, status: 403, message: 'This feature is not included in your current plan', limit: null };
        return { allowed: true, status: 200, message: null, limit: f.limit };
    }), callback);
}

/**
 * True when the tenant is already at or over the cap for a feature.
 * `currentCount` is supplied by the caller, since only it knows what to count.
 */
function isWithinLimit(tenantId, featureKey, currentCount, callback) {
    return adapt(getResolved(tenantId).then(function (e) {
        var limit = e.limits[featureKey];
        if (limit === null || limit === undefined) return true; // unlimited
        return Number(currentCount) < Number(limit);
    }), callback);
}

/** Lets a promise-returning function also be used with a callback. */
function adapt(promise, callback) {
    if (typeof callback !== 'function') return promise;
    promise.then(function (v) { callback(null, v); }, function (e) { callback(e); });
}

module.exports = {
    getTenantEntitlements: getTenantEntitlements,
    getTenantFeatures: getTenantFeatures,
    hasFeature: hasFeature,
    getFeatureLimit: getFeatureLimit,
    getTenantApplications: getTenantApplications,
    validateFeatureAccess: validateFeatureAccess,
    isWithinLimit: isWithinLimit,
    invalidate: invalidate
};
