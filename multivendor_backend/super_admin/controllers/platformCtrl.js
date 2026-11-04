var sqldb = require('../../config/dbconnect');
var dbutil = require(appRoot + '/utils/dbutils');
var audit = require('../utils/auditlog');
// Entitlements are cached per tenant; any write that changes an answer must
// invalidate, or a tenant keeps its old access for up to the cache TTL.
var entitlements = require(appRoot + '/utils/entitlements');

// Platform-wide Super Admin modules: tenants, partners, plans, subscriptions,
// billing, vendors, customers, orders, activity log.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function q(sql, params, ctx) {
    return new Promise(function (resolve, reject) {
        dbutil.sqlinjection(sqldb.MySQLConPool, sql, params || [], ctx, function (err, rows) {
            if (err) reject(err); else resolve(rows);
        });
    });
}

function withTransaction(work) {
    return new Promise(function (resolve, reject) {
        sqldb.MySQLConPool.getConnection(function (err, conn) {
            if (err) return reject(err);
            var tq = function (sql, params) {
                return new Promise(function (res2, rej2) {
                    conn.query(sql, params || [], function (e, rows) {
                        if (e) { console.error('[platformCtrl] tx query error:', e.code, e.sqlMessage); rej2(e); } else res2(rows);
                    });
                });
            };
            conn.beginTransaction(function (be) {
                if (be) { conn.release(); return reject(be); }
                work(tq).then(function (result) {
                    conn.commit(function (ce) {
                        if (ce) return conn.rollback(function () { conn.release(); reject(ce); });
                        conn.release();
                        resolve(result);
                    });
                }).catch(function (we) {
                    conn.rollback(function () { conn.release(); reject(we); });
                });
            });
        });
    });
}

function fail(message, status) {
    var e = new Error(message);
    e.userMessage = message;
    e.status = status || 202;
    return e;
}

function handle(ctx, fn) {
    return function (req, res) {
        Promise.resolve().then(function () { return fn(req, res); }).catch(function (err) {
            if (err && err.userMessage) return res.json({ status: err.status, message: err.userMessage });
            console.error('[super_admin/' + ctx + ']', err && (err.sqlMessage || err.message || err));
            return res.json({ status: 500, message: 'Internal server error' });
        });
    };
}

function blank(v) { return v === undefined || v === null || v === ''; }
function orNull(v) { return blank(v) ? null : v; }
function num(v, fallback) { var n = Number(v); return blank(v) || isNaN(n) ? fallback : n; }

function pickStatus(value, allowed) {
    var n = Number(value);
    if (blank(value) || allowed.indexOf(n) === -1) throw fail('Invalid status value');
    return n;
}

// end date for a subscription starting on startDate (YYYY-MM-DD)
function computeEndDateSql(cycle, status, trialDays) {
    if (Number(status) === 0) return { expr: 'DATE_ADD(?, INTERVAL ? DAY)', extra: [trialDays] };
    if (cycle === 'yearly') return { expr: 'DATE_ADD(?, INTERVAL 1 YEAR)', extra: [] };
    return { expr: 'DATE_ADD(?, INTERVAL 1 MONTH)', extra: [] };
}

var ORDER_GMV = "CASE WHEN o.order_status NOT IN (5,6) THEN o.grand_total ELSE 0 END";

// ---------------------------------------------------------------------------
// DASHBOARD (business-level statistics only; store operations live in the tenant admin)
// ---------------------------------------------------------------------------
var TENANT_SALES_JOIN = "LEFT JOIN (SELECT v.tenant_id, COUNT(o.id) AS order_count, SUM(" + ORDER_GMV + ") AS sales " +
    "FROM orders o INNER JOIN vendors v ON v.id = o.vendor_id WHERE o.d_in = 0 GROUP BY v.tenant_id) os ON os.tenant_id = t.id ";

exports.getDashboard = handle('getDashboard', async function (req, res) {
    var counts = await q("SELECT " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0) AS tenant_count, " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND onboarding_status = 2) AS live_tenants, " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND onboarding_status IN (0,1)) AS onboarding_tenants, " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND onboarding_status = 3) AS suspended_tenants, " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND partner_id IS NULL) AS direct_tenants, " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND partner_id IS NOT NULL) AS partner_tenants, " +
        "(SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND i_ts >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS new_tenants_this_month, " +
        "(SELECT COUNT(*) FROM partners WHERE d_in = 0) AS partner_count, " +
        "(SELECT COUNT(*) FROM partners WHERE d_in = 0 AND active_status = 1) AS active_partners, " +
        "(SELECT COUNT(*) FROM vendors v INNER JOIN tenants t ON t.id = v.tenant_id AND t.d_in = 0 WHERE v.d_in = 0) AS shop_count, " +
        "(SELECT COUNT(*) FROM vendors v INNER JOIN tenants t ON t.id = v.tenant_id AND t.d_in = 0 WHERE v.d_in = 0 AND v.active_status = 1) AS active_shops, " +
        "(SELECT COUNT(*) FROM customers c INNER JOIN tenants t ON t.id = c.tenant_id AND t.d_in = 0 WHERE c.d_in = 0) AS end_customer_count, " +
        "(SELECT IFNULL(SUM(o.grand_total),0) FROM orders o WHERE o.d_in = 0 AND o.order_status NOT IN (5,6)) AS total_sales, " +
        "(SELECT IFNULL(SUM(o.grand_total),0) FROM orders o WHERE o.d_in = 0 AND o.order_status NOT IN (5,6) AND o.order_date_time >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS sales_this_month, " +
        "(SELECT COUNT(*) FROM orders o WHERE o.d_in = 0 AND o.order_status NOT IN (5,6)) AS total_orders, " +
        "(SELECT IFNULL(SUM(amount + tax_amount),0) FROM billing_transactions WHERE d_in = 0 AND payment_status = 1) AS billing_collected, " +
        "(SELECT IFNULL(SUM(amount + tax_amount),0) FROM billing_transactions WHERE d_in = 0 AND payment_status = 1 AND paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS billing_this_month, " +
        "(SELECT IFNULL(SUM(amount + tax_amount),0) FROM billing_transactions WHERE d_in = 0 AND payment_status = 0) AS billing_pending, " +
        "(SELECT COUNT(*) FROM billing_transactions WHERE d_in = 0 AND payment_status = 0) AS pending_payments, " +
        "(SELECT IFNULL(SUM(CASE WHEN s.billing_cycle = 'yearly' THEN pl.price_yearly / 12 ELSE pl.price_monthly END),0) " +
        "  FROM tenant_subscriptions s INNER JOIN plans pl ON pl.id = s.plan_id INNER JOIN tenants t ON t.id = s.tenant_id AND t.d_in = 0 " +
        "  WHERE s.d_in = 0 AND s.status = 1 AND s.end_date >= CURDATE()) AS mrr, " +
        "(SELECT COUNT(*) FROM tenant_subscriptions WHERE d_in = 0 AND status IN (0,1) AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS renewals_due_30d, " +
        "(SELECT COUNT(*) FROM tenant_subscriptions WHERE d_in = 0 AND status IN (0,1) AND end_date < CURDATE()) AS lapsed_subscriptions, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0) AS enquiry_count, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND status = 0) AS new_enquiries, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND enquiry_type = 'client') AS client_enquiries, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND enquiry_type = 'partner') AS partner_enquiries, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND status = 3) AS converted_enquiries, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND i_ts >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS enquiries_this_month, " +
        "(SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND status IN (1,2) AND follow_up_date <= CURDATE()) AS follow_ups_due, " +
        "(SELECT COUNT(*) FROM dev_support_tickets WHERE d_in = 0 AND dev_status IN (0,1,2)) AS open_tickets", [], 'dash-counts');

    var trend = await q("SELECT m.ym, " +
        "IFNULL((SELECT SUM(grand_total) FROM orders WHERE d_in = 0 AND order_status NOT IN (5,6) AND DATE_FORMAT(order_date_time,'%Y-%m') = m.ym),0) AS sales, " +
        "IFNULL((SELECT SUM(amount + tax_amount) FROM billing_transactions WHERE d_in = 0 AND payment_status = 1 AND DATE_FORMAT(paid_at,'%Y-%m') = m.ym),0) AS billing, " +
        "IFNULL((SELECT COUNT(*) FROM tenants WHERE d_in = 0 AND DATE_FORMAT(i_ts,'%Y-%m') = m.ym),0) AS new_tenants, " +
        "IFNULL((SELECT COUNT(*) FROM website_enquiries WHERE d_in = 0 AND DATE_FORMAT(i_ts,'%Y-%m') = m.ym),0) AS enquiries " +
        "FROM (SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m') AS ym FROM " +
        "(SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) k) m ORDER BY m.ym", [], 'dash-trend');

    var topTenants = await q("SELECT t.id, t.tenant_name, p.partner_name, pl.plan_name, " +
        "(SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = t.id AND v.d_in = 0) AS shop_count, " +
        "IFNULL(os.order_count,0) AS order_count, IFNULL(os.sales,0) AS sales " +
        "FROM tenants t LEFT JOIN partners p ON p.id = t.partner_id LEFT JOIN plans pl ON pl.id = t.plan_id " + TENANT_SALES_JOIN +
        "WHERE t.d_in = 0 ORDER BY sales DESC, shop_count DESC LIMIT 5", [], 'dash-toptenants');

    var topPartners = await q("SELECT p.id, p.partner_name, COUNT(t.id) AS tenant_count, " +
        "IFNULL(SUM((SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = t.id AND v.d_in = 0)),0) AS shop_count, " +
        "IFNULL(SUM(os.sales),0) AS sales " +
        "FROM partners p LEFT JOIN tenants t ON t.partner_id = p.id AND t.d_in = 0 " + TENANT_SALES_JOIN +
        "WHERE p.d_in = 0 GROUP BY p.id ORDER BY sales DESC, tenant_count DESC LIMIT 5", [], 'dash-toppartners');

    var packages = await q("SELECT pl.id, pl.plan_name, COUNT(t.id) AS tenant_count FROM plans pl " +
        "LEFT JOIN tenants t ON t.plan_id = pl.id AND t.d_in = 0 WHERE pl.d_in = 0 GROUP BY pl.id " +
        "UNION ALL SELECT NULL, 'No package', COUNT(*) FROM tenants WHERE d_in = 0 AND plan_id IS NULL", [], 'dash-packages');

    var renewals = await q("SELECT s.id, t.tenant_name, pl.plan_name, s.status, s.end_date, DATEDIFF(s.end_date, CURDATE()) AS days_left, " +
        "CASE WHEN s.billing_cycle = 'yearly' THEN pl.price_yearly ELSE pl.price_monthly END AS amount " +
        "FROM tenant_subscriptions s INNER JOIN tenants t ON t.id = s.tenant_id AND t.d_in = 0 LEFT JOIN plans pl ON pl.id = s.plan_id " +
        "WHERE s.d_in = 0 AND s.status IN (0,1) AND s.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) ORDER BY s.end_date LIMIT 6", [], 'dash-renewals');

    var enquiries = await q("SELECT id, enquiry_type, contact_name, business_name, city, status, i_ts FROM website_enquiries " +
        "WHERE d_in = 0 ORDER BY i_ts DESC LIMIT 6", [], 'dash-enquiries');

    return res.json({
        status: 200,
        data: Object.assign({}, counts[0] || {}, {
            monthly_trend: trend, top_tenants: topTenants, top_partners: topPartners,
            package_distribution: packages, renewals_due: renewals, recent_enquiries: enquiries
        })
    });
});

// ---------------------------------------------------------------------------
// REPORTS — client and partner performance for a period
// ---------------------------------------------------------------------------
exports.getreports = handle('getreports', async function (req, res) {
    var b = req.body || {};
    var from = blank(b.from_date) ? '1970-01-01' : b.from_date;
    var to = blank(b.to_date) ? '2999-12-31' : b.to_date;

    var rows = await q("SELECT t.id, t.tenant_name, t.tenant_unique_code, t.business_type, t.onboarding_status, t.active_status, t.i_ts, " +
        "t.partner_id, p.partner_name, pl.plan_name, sub.billing_cycle, sub.status AS subscription_status, sub.end_date AS renewal_date, " +
        "(SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = t.id AND v.d_in = 0) AS shop_count, " +
        "(SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = t.id AND v.d_in = 0 AND v.active_status = 1) AS active_shops, " +
        "(SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id AND c.d_in = 0) AS customer_count, " +
        "(SELECT COUNT(*) FROM orders o INNER JOIN vendors v ON v.id = o.vendor_id WHERE v.tenant_id = t.id AND o.d_in = 0 AND o.order_status NOT IN (5,6) " +
        "  AND o.order_date_time >= ? AND o.order_date_time < DATE_ADD(?, INTERVAL 1 DAY)) AS orders, " +
        "(SELECT IFNULL(SUM(o.grand_total),0) FROM orders o INNER JOIN vendors v ON v.id = o.vendor_id WHERE v.tenant_id = t.id AND o.d_in = 0 AND o.order_status NOT IN (5,6) " +
        "  AND o.order_date_time >= ? AND o.order_date_time < DATE_ADD(?, INTERVAL 1 DAY)) AS sales, " +
        "(SELECT IFNULL(SUM(bt.amount + bt.tax_amount),0) FROM billing_transactions bt INNER JOIN tenant_subscriptions s2 ON s2.id = bt.tenant_subscription_id " +
        "  WHERE s2.tenant_id = t.id AND bt.d_in = 0 AND bt.payment_status = 1 AND bt.paid_at >= ? AND bt.paid_at < DATE_ADD(?, INTERVAL 1 DAY)) AS billing_paid " +
        "FROM tenants t LEFT JOIN partners p ON p.id = t.partner_id LEFT JOIN plans pl ON pl.id = t.plan_id " +
        "LEFT JOIN tenant_subscriptions sub ON sub.id = (SELECT s.id FROM tenant_subscriptions s WHERE s.tenant_id = t.id AND s.d_in = 0 ORDER BY s.id DESC LIMIT 1) " +
        "WHERE t.d_in = 0 ORDER BY sales DESC, t.tenant_name", [from, to, from, to, from, to], 'getreports');

    var partners = await q("SELECT id, partner_name, partner_unique_code, commission_type, commission_value, active_status FROM partners WHERE d_in = 0 ORDER BY partner_name", [], 'getreports-partners');
    return res.json({ status: 200, data: { tenants: rows, partners: partners } });
});

// ---------------------------------------------------------------------------
// WEBSITE ENQUIRIES
// ---------------------------------------------------------------------------
exports.getenquiries = handle('getenquiries', async function (req, res) {
    var rows = await q("SELECT e.*, pl.plan_name AS interested_plan_name, t.tenant_name AS converted_tenant_name, p.partner_name AS converted_partner_name, " +
        "u.name AS updated_by_name " +
        "FROM website_enquiries e LEFT JOIN plans pl ON pl.id = e.interested_plan_id " +
        "LEFT JOIN tenants t ON t.id = e.converted_tenant_id LEFT JOIN partners p ON p.id = e.converted_partner_id " +
        "LEFT JOIN super_admin_users u ON u.id = e.updated_by " +
        "WHERE e.d_in = 0 ORDER BY e.i_ts DESC", [], 'getenquiries');
    return res.json({ status: 200, data: rows });
});

exports.addenquiry = handle('addenquiry', async function (req, res) {
    var b = req.body;
    var v = validateEnquiry(b);
    var ins = await q("INSERT INTO website_enquiries (enquiry_type, contact_name, business_name, mobile_number, email, city, business_type, interested_plan_id, message, source, status, updated_by, updated_at, i_ts) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())",
        [v.enquiry_type, v.contact_name, v.business_name, v.mobile_number, v.email, v.city, v.business_type, orNull(b.interested_plan_id), v.message, b.source || 'manual', req.admin.id], 'addenquiry');
    audit.log(req, { action: 'enquiry_added', entity_type: 'enquiry', entity_id: ins.insertId, new_value: { type: v.enquiry_type, name: v.contact_name } });
    return res.json({ status: 200, message: 'Enquiry added', insertId: ins.insertId });
});

exports.updateenquiry = handle('updateenquiry', async function (req, res) {
    var b = req.body;
    var old = await q("SELECT status, remarks, follow_up_date FROM website_enquiries WHERE id = ? AND d_in = 0", [b.id], 'updateenquiry-old');
    if (!old.length) throw fail('Enquiry not found');
    var status = blank(b.status) ? old[0].status : pickStatus(b.status, [0, 1, 2, 3, 4]);
    await q("UPDATE website_enquiries SET status = ?, remarks = ?, follow_up_date = ?, updated_by = ?, updated_at = NOW() WHERE id = ?",
        [status, b.remarks === undefined ? old[0].remarks : orNull(b.remarks), b.follow_up_date === undefined ? old[0].follow_up_date : orNull(b.follow_up_date), req.admin.id, b.id], 'updateenquiry');
    audit.log(req, { action: 'enquiry_updated', entity_type: 'enquiry', entity_id: Number(b.id), old_value: { status: old[0].status }, new_value: { status: status, remarks: b.remarks } });
    return res.json({ status: 200, message: 'Enquiry updated' });
});

exports.deleteenquiry = handle('deleteenquiry', async function (req, res) {
    await q("UPDATE website_enquiries SET d_in = 1 WHERE id = ?", [req.body.id], 'deleteenquiry');
    audit.log(req, { action: 'enquiry_deleted', entity_type: 'enquiry', entity_id: Number(req.body.id) });
    return res.json({ status: 200, message: 'Enquiry deleted' });
});

function validateEnquiry(b) {
    var v = {
        enquiry_type: b.enquiry_type === 'partner' ? 'partner' : 'client',
        contact_name: String(b.contact_name || '').trim().slice(0, 255),
        business_name: orNull(String(b.business_name || '').trim().slice(0, 255)),
        mobile_number: String(b.mobile_number || '').replace(/\D/g, '').slice(-10),
        email: orNull(String(b.email || '').trim().slice(0, 255)),
        city: orNull(String(b.city || '').trim().slice(0, 150)),
        business_type: orNull(String(b.business_type || '').trim().slice(0, 100)),
        message: orNull(String(b.message || '').trim().slice(0, 2000))
    };
    if (!v.contact_name) throw fail('Name is required');
    if (!/^[0-9]{10}$/.test(v.mobile_number)) throw fail('A valid 10-digit mobile number is required');
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) throw fail('Please enter a valid email');
    return v;
}
exports.validateEnquiry = validateEnquiry;

// Links an enquiry to the tenant/partner it was converted into (called inside add flows)
async function markEnquiryConverted(req, enquiryId, field, id) {
    if (blank(enquiryId)) return;
    await q("UPDATE website_enquiries SET status = 3, " + field + " = ?, updated_by = ?, updated_at = NOW() WHERE id = ? AND d_in = 0",
        [id, req.admin.id, enquiryId], 'enquiry-convert');
    audit.log(req, { action: 'enquiry_converted', entity_type: 'enquiry', entity_id: Number(enquiryId), new_value: { [field]: id } });
}

// ---------------------------------------------------------------------------
// BUSINESS TYPES (master for the tenant form; replaces the free-text column)
// ---------------------------------------------------------------------------
exports.getbusinesstypes = handle('getbusinesstypes', async function (req, res) {
    var rows = await q("SELECT bt.*, (SELECT COUNT(*) FROM tenants t WHERE t.business_type_id = bt.id AND t.d_in = 0) AS tenant_count " +
        "FROM business_types bt WHERE bt.d_in = 0 ORDER BY bt.sort_order, bt.type_name", [], 'getbusinesstypes');
    return res.json({ status: 200, data: rows });
});

exports.savebusinesstype = handle('savebusinesstype', async function (req, res) {
    var b = req.body;
    var name = String(b.type_name || '').trim();
    if (!name) throw fail('Business type name is required');
    // Codes are stable keys and are also written to tenants.business_type, so
    // normalise them the same way everywhere.
    var code = String(b.type_code || name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!code) throw fail('Business type code is required');

    var dup = await q("SELECT id FROM business_types WHERE type_code = ? AND d_in = 0 AND id <> ?", [code, b.id || 0], 'savebusinesstype-dup');
    if (dup.length) throw fail('A business type with this code already exists', 300);

    var active = blank(b.is_active) ? 1 : (Number(b.is_active) ? 1 : 0);
    var order = num(b.sort_order, 0);

    if (blank(b.id)) {
        var ins = await q("INSERT INTO business_types (type_name, type_code, description, sort_order, is_active, i_ts) VALUES (?, ?, ?, ?, ?, NOW())",
            [name, code, orNull(b.description), order, active], 'savebusinesstype-ins');
        audit.log(req, { action: 'business_type_created', entity_type: 'business_type', entity_id: ins.insertId, new_value: { type_name: name, type_code: code } });
        return res.json({ status: 200, message: 'Business type created', insertId: ins.insertId });
    }

    var old = await q("SELECT type_name, type_code, is_active FROM business_types WHERE id = ? AND d_in = 0", [b.id], 'savebusinesstype-old');
    if (!old.length) throw fail('Business type not found');
    await q("UPDATE business_types SET type_name = ?, type_code = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?",
        [name, code, orNull(b.description), order, active, b.id], 'savebusinesstype-upd');
    // tenants.business_type mirrors the code, so a renamed code must follow.
    if (old[0].type_code !== code) {
        await q("UPDATE tenants SET business_type = ? WHERE business_type_id = ?", [code, b.id], 'savebusinesstype-sync');
    }
    audit.log(req, {
        action: 'business_type_updated', entity_type: 'business_type', entity_id: Number(b.id),
        old_value: { type_name: old[0].type_name, type_code: old[0].type_code, is_active: old[0].is_active },
        new_value: { type_name: name, type_code: code, is_active: active }
    });
    return res.json({ status: 200, message: 'Business type updated' });
});

exports.updatebusinesstypestatus = handle('updatebusinesstypestatus', async function (req, res) {
    var b = req.body;
    var value = pickStatus(b.value, [0, 1]);
    var old = await q("SELECT is_active FROM business_types WHERE id = ? AND d_in = 0", [b.id], 'businesstypestatus-old');
    if (!old.length) throw fail('Business type not found');
    await q("UPDATE business_types SET is_active = ? WHERE id = ?", [value, b.id], 'updatebusinesstypestatus');
    audit.log(req, { action: 'business_type_status_changed', entity_type: 'business_type', entity_id: Number(b.id), old_value: { is_active: old[0].is_active }, new_value: { is_active: value } });
    return res.json({ status: 200, message: 'Status updated' });
});

exports.deletebusinesstype = handle('deletebusinesstype', async function (req, res) {
    var id = req.body.id;
    if (blank(id)) throw fail('Business type ID is required');
    // Deleting one out from under a tenant would leave the tenant form blank.
    var inUse = await q("SELECT COUNT(*) AS cnt FROM tenants WHERE business_type_id = ? AND d_in = 0", [id], 'deletebusinesstype-inuse');
    if (inUse[0] && inUse[0].cnt > 0) throw fail('This business type is assigned to ' + inUse[0].cnt + ' tenant(s). Deactivate it instead.', 300);
    await q("UPDATE business_types SET d_in = 1 WHERE id = ?", [id], 'deletebusinesstype');
    await q("UPDATE business_type_features SET d_in = 1 WHERE business_type_id = ?", [id], 'deletebusinesstype-features');
    audit.log(req, { action: 'business_type_deleted', entity_type: 'business_type', entity_id: Number(id) });
    return res.json({ status: 200, message: 'Business type deleted' });
});

/**
 * Resolves the business type for a tenant write. `business_type_id` is the
 * authoritative link; `tenants.business_type` keeps the code so the existing
 * readers (website_enquiries, categories.vertical conventions) still work.
 * A legacy code string is still accepted so older callers do not break.
 */
async function resolveBusinessType(run, b) {
    if (!blank(b.business_type_id)) {
        var rows = await run("SELECT id, type_code, is_active FROM business_types WHERE id = ? AND d_in = 0", [b.business_type_id]);
        if (!rows.length) throw fail('Selected business type not found');
        if (!Number(rows[0].is_active)) throw fail('Selected business type is inactive');
        return { id: rows[0].id, code: rows[0].type_code };
    }
    if (blank(b.business_type)) return { id: null, code: null };
    var code = String(b.business_type).trim().toUpperCase();
    var byCode = await run("SELECT id, type_code FROM business_types WHERE type_code = ? AND d_in = 0", [code]);
    return byCode.length ? { id: byCode[0].id, code: byCode[0].type_code } : { id: null, code: String(b.business_type).trim() };
}

/**
 * The full `tenant_branding` column set, from either the explicit column names
 * or the older `logo` / `brand_color` aliases the tenant form used to send.
 * Blank values resolve to NULL and are COALESCEd on update, so omitting a field
 * keeps whatever is already stored rather than wiping it.
 */
function brandingFrom(b) {
    return {
        logo_light: blank(b.logo_light) ? orNull(b.logo) : b.logo_light,
        logo_dark: orNull(b.logo_dark),
        logo_icon: orNull(b.logo_icon),
        login_bg_image: orNull(b.login_bg_image),
        favicon: orNull(b.favicon),
        primary_color: blank(b.primary_color) ? orNull(b.brand_color) : b.primary_color,
        secondary_color: orNull(b.secondary_color),
        sidebar_color: orNull(b.sidebar_color),
        header_color: orNull(b.header_color),
        button_color: orNull(b.button_color),
        font_family: orNull(b.font_family)
    };
}

var BRANDING_COLUMNS = ['logo_light', 'logo_dark', 'logo_icon', 'login_bg_image', 'favicon',
    'primary_color', 'secondary_color', 'sidebar_color', 'header_color', 'button_color', 'font_family'];

/** True when the caller sent at least one branding field. */
function hasBranding(b) {
    if (b.logo !== undefined || b.brand_color !== undefined) return true;
    for (var i = 0; i < BRANDING_COLUMNS.length; i++) {
        if (b[BRANDING_COLUMNS[i]] !== undefined) return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// FEATURES (catalog used by packages)
// ---------------------------------------------------------------------------
exports.getfeatures = handle('getfeatures', async function (req, res) {
    var rows = await q("SELECT f.*, (SELECT COUNT(DISTINCT pf.plan_id) FROM plan_features pf INNER JOIN plans pl ON pl.id = pf.plan_id AND pl.d_in = 0 " +
        "WHERE pf.feature_id = f.id AND pf.d_in = 0) AS plan_count FROM features f WHERE f.d_in = 0 ORDER BY f.feature_name", [], 'getfeatures');
    return res.json({ status: 200, data: rows });
});

exports.savefeature = handle('savefeature', async function (req, res) {
    entitlements.invalidate();
    var b = req.body;
    var name = String(b.feature_name || '').trim();
    if (!name) throw fail('Feature name is required');
    var key = String(b.feature_key || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    var dup = await q("SELECT id FROM features WHERE feature_key = ? AND d_in = 0 AND id <> ?", [key, b.id || 0], 'savefeature-dup');
    if (dup.length) throw fail('A feature with this key already exists', 300);
    if (blank(b.id)) {
        var ins = await q("INSERT INTO features (feature_name, feature_key, description, is_active, i_ts) VALUES (?, ?, ?, 1, NOW())", [name, key, orNull(b.description)], 'savefeature-ins');
        audit.log(req, { action: 'feature_created', entity_type: 'feature', entity_id: ins.insertId, new_value: { feature_name: name } });
    } else {
        await q("UPDATE features SET feature_name = ?, feature_key = ?, description = ?, is_active = ? WHERE id = ?",
            [name, key, orNull(b.description), blank(b.is_active) ? 1 : (Number(b.is_active) ? 1 : 0), b.id], 'savefeature-upd');
        audit.log(req, { action: 'feature_updated', entity_type: 'feature', entity_id: Number(b.id), new_value: { feature_name: name } });
    }
    return res.json({ status: 200, message: 'Feature saved' });
});

exports.deletefeature = handle('deletefeature', async function (req, res) {
    entitlements.invalidate();
    await q("UPDATE features SET d_in = 1 WHERE id = ?", [req.body.id], 'deletefeature');
    await q("UPDATE plan_features SET d_in = 1 WHERE feature_id = ?", [req.body.id], 'deletefeature-plans');
    audit.log(req, { action: 'feature_deleted', entity_type: 'feature', entity_id: Number(req.body.id) });
    return res.json({ status: 200, message: 'Feature deleted' });
});

async function savePlanFeatures(planId, features) {
    entitlements.invalidate(); // plan membership changed for every tenant on it
    if (!Array.isArray(features)) return;
    await q("DELETE FROM plan_features WHERE plan_id = ?", [planId], 'planfeatures-del');
    var rows = features.filter(function (f) { return !blank(f.feature_id); });
    if (!rows.length) return;
    var placeholders = rows.map(function () { return '(?, ?, ?, NOW())'; }).join(', ');
    var params = [];
    rows.forEach(function (f) { params.push(planId, f.feature_id, orNull(f.feature_limit)); });
    await q("INSERT INTO plan_features (plan_id, feature_id, feature_limit, i_ts) VALUES " + placeholders, params, 'planfeatures-ins');
}

var PLAN_FEATURES_QRY = "SELECT pf.plan_id, f.id AS feature_id, f.feature_name, f.feature_key, pf.feature_limit FROM plan_features pf " +
    "INNER JOIN features f ON f.id = pf.feature_id AND f.d_in = 0 WHERE pf.d_in = 0";

// ---------------------------------------------------------------------------
// LOOKUPS (dropdown data shared by several pages)
// ---------------------------------------------------------------------------
exports.getlookups = handle('getlookups', async function (req, res) {
    var tenants = await q("SELECT id, tenant_name, tenant_unique_code, plan_id, active_status FROM tenants WHERE d_in = 0 ORDER BY tenant_name", [], 'lookups-tenants');
    var partners = await q("SELECT id, partner_name, active_status FROM partners WHERE d_in = 0 ORDER BY partner_name", [], 'lookups-partners');
    var plans = await q("SELECT id, plan_name, plan_code, price_monthly, price_yearly, trial_days, is_active FROM plans WHERE d_in = 0 ORDER BY price_monthly", [], 'lookups-plans');
    var features = await q(PLAN_FEATURES_QRY + " ORDER BY f.feature_name", [], 'lookups-features');
    plans.forEach(function (p) { p.features = features.filter(function (f) { return f.plan_id === p.id; }); });
    // Active business types only — the tenant form must not offer a retired one.
    var businessTypes = await q("SELECT id, type_name, type_code FROM business_types WHERE d_in = 0 AND is_active = 1 ORDER BY sort_order, type_name", [], 'lookups-businesstypes');
    return res.json({ status: 200, data: { tenants: tenants, partners: partners, plans: plans, business_types: businessTypes } });
});

// ---------------------------------------------------------------------------
// TENANTS
// ---------------------------------------------------------------------------
var TENANT_LIST_QRY = "SELECT t.id, t.tenant_name, t.tenant_unique_code, t.owner_name, t.owner_mobile_number, t.owner_email, " +
    "t.business_type, t.business_type_id, bt.type_name AS business_type_name, t.business_address, t.partner_id, p.partner_name, t.plan_id, pl.plan_name, " +
    "t.onboarding_status, t.active_status, t.i_ts, " +
    "COALESCE(br.logo_icon, br.logo_light, t.logo_image) AS logo, br.primary_color AS brand_color, " +
    "br.logo_light, br.logo_dark, br.logo_icon, br.login_bg_image, br.favicon, " +
    "br.primary_color, br.secondary_color, br.sidebar_color, br.header_color, br.button_color, br.font_family, " +
    "ts.support_email, ts.support_phone, ts.currency_code, ts.timezone, " +
    // Payment modes on the list, so COD-only tenants are visible at a glance.
    "IFNULL(cs.cod_enabled, 1) AS cod_enabled, " +
    "(SELECT COUNT(*) FROM payment_gateway_settings g WHERE g.tenant_id = t.id AND IFNULL(g.d_in,0) = 0 AND IFNULL(g.api_key,'') <> '' AND IFNULL(g.api_secret,'') <> '') AS online_configured, " +
    "(SELECT COUNT(*) FROM payment_gateway_settings g WHERE g.tenant_id = t.id AND IFNULL(g.d_in,0) = 0 AND g.is_active = 1 AND IFNULL(g.api_key,'') <> '' AND IFNULL(g.api_secret,'') <> '') AS online_enabled, " +
    "sub.id AS subscription_id, sub.status AS subscription_status, sub.billing_cycle, sub.start_date AS subscription_start, " +
    "sub.end_date AS subscription_end, sub.auto_renew, DATEDIFF(sub.end_date, CURDATE()) AS days_to_expiry, " +
    "(SELECT GROUP_CONCAT(DISTINCT l.city ORDER BY l.city SEPARATOR ', ') FROM locations l WHERE l.tenant_id = t.id AND l.d_in = 0) AS cities, " +
    "(SELECT COALESCE(d.custom_domain, d.subdomain) FROM tenant_domains d WHERE d.tenant_id = t.id AND d.d_in = 0 ORDER BY d.is_primary DESC, d.id LIMIT 1) AS primary_domain, " +
    "(SELECT d.subdomain FROM tenant_domains d WHERE d.tenant_id = t.id AND d.d_in = 0 ORDER BY d.is_primary DESC, d.id LIMIT 1) AS subdomain, " +
    "(SELECT d.custom_domain FROM tenant_domains d WHERE d.tenant_id = t.id AND d.d_in = 0 ORDER BY d.is_primary DESC, d.id LIMIT 1) AS custom_domain, " +
    "(SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = t.id AND v.d_in = 0) AS vendor_count, " +
    "(SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = t.id AND v.d_in = 0 AND v.active_status = 1) AS active_vendor_count, " +
    "(SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id AND c.d_in = 0) AS customer_count, " +
    "IFNULL(os.order_count, 0) AS order_count, IFNULL(os.gmv, 0) AS gmv, " +
    "(SELECT IFNULL(SUM(bt.amount),0) FROM billing_transactions bt INNER JOIN tenant_subscriptions s3 ON s3.id = bt.tenant_subscription_id " +
    "  WHERE s3.tenant_id = t.id AND bt.payment_status = 1 AND bt.d_in = 0) AS total_paid " +
    "FROM tenants t " +
    "LEFT JOIN partners p ON p.id = t.partner_id " +
    "LEFT JOIN business_types bt ON bt.id = t.business_type_id " +
    "LEFT JOIN plans pl ON pl.id = t.plan_id " +
    "LEFT JOIN tenant_settings ts ON ts.id = (SELECT MAX(ts2.id) FROM tenant_settings ts2 WHERE ts2.tenant_id = t.id AND ts2.d_in = 0) " +
    "LEFT JOIN tenant_charge_settings cs ON cs.id = (SELECT MAX(cs2.id) FROM tenant_charge_settings cs2 WHERE cs2.tenant_id = t.id AND cs2.d_in = 0) " +
    "LEFT JOIN tenant_branding br ON br.id = (SELECT MIN(b2.id) FROM tenant_branding b2 WHERE b2.tenant_id = t.id AND b2.d_in = 0) " +
    "LEFT JOIN tenant_subscriptions sub ON sub.id = (SELECT s2.id FROM tenant_subscriptions s2 WHERE s2.tenant_id = t.id AND s2.d_in = 0 ORDER BY s2.id DESC LIMIT 1) " +
    "LEFT JOIN (SELECT v.tenant_id, COUNT(o.id) AS order_count, SUM(" + ORDER_GMV + ") AS gmv " +
    "  FROM orders o INNER JOIN vendors v ON v.id = o.vendor_id WHERE o.d_in = 0 GROUP BY v.tenant_id) os ON os.tenant_id = t.id " +
    "WHERE t.d_in = 0";

exports.gettenants = handle('gettenants', async function (req, res) {
    var rows = await q(TENANT_LIST_QRY + " ORDER BY t.i_ts DESC", [], 'gettenants');
    return res.json({ status: 200, data: rows });
});

var PROVISIONING_STEPS = ['kyc', 'branding', 'catalog', 'payment_gateway', 'go_live'];

// Primary white-label domain (subdomain and/or custom domain)
async function saveDomain(tq, tenantId, b) {
    if (b.subdomain === undefined && b.custom_domain === undefined) return;
    var sub = blank(b.subdomain) ? null : String(b.subdomain).trim().toLowerCase();
    var custom = blank(b.custom_domain) ? null : String(b.custom_domain).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    var taken = await tq("SELECT tenant_id FROM tenant_domains WHERE d_in = 0 AND tenant_id <> ? AND ((? IS NOT NULL AND subdomain = ?) OR (? IS NOT NULL AND custom_domain = ?)) LIMIT 1",
        [tenantId, sub, sub, custom, custom]);
    if (taken.length) throw fail('This domain is already registered to another tenant', 300);
    var existing = await tq("SELECT id FROM tenant_domains WHERE tenant_id = ? AND d_in = 0 ORDER BY is_primary DESC, id LIMIT 1", [tenantId]);
    if (existing.length) {
        await tq("UPDATE tenant_domains SET subdomain = ?, custom_domain = ? WHERE id = ?", [sub, custom, existing[0].id]);
    } else if (sub || custom) {
        await tq("INSERT INTO tenant_domains (tenant_id, subdomain, custom_domain, ssl_status, is_primary, i_ts) VALUES (?, ?, ?, 0, 1, NOW())", [tenantId, sub, custom]);
    }
}

async function insertSubscription(tq, tenantId, b) {
    var plans = await tq("SELECT id, trial_days FROM plans WHERE id = ? AND d_in = 0", [b.plan_id]);
    if (!plans.length) throw fail('Selected plan not found');
    var status = blank(b.status) ? (plans[0].trial_days > 0 ? 0 : 1) : pickStatus(b.status, [0, 1]);
    if (status === 0 && !(plans[0].trial_days > 0)) throw fail('This plan has no trial period');
    var cycle = b.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
    var start = blank(b.start_date) ? new Date().toISOString().slice(0, 10) : b.start_date;
    var end = computeEndDateSql(cycle, status, plans[0].trial_days);

    // A tenant has one open subscription at a time; supersede the previous one.
    await tq("UPDATE tenant_subscriptions SET status = 3 WHERE tenant_id = ? AND status IN (0,1) AND d_in = 0", [tenantId]);
    var ins = await tq("INSERT INTO tenant_subscriptions (tenant_id, plan_id, billing_cycle, start_date, end_date, auto_renew, status, i_ts) " +
        "VALUES (?, ?, ?, ?, " + end.expr + ", ?, ?, NOW())",
        [tenantId, b.plan_id, cycle, start, start].concat(end.extra).concat([blank(b.auto_renew) ? 1 : (Number(b.auto_renew) ? 1 : 0), status]));
    await tq("UPDATE tenants SET plan_id = ? WHERE id = ?", [b.plan_id, tenantId]);
    return ins.insertId;
}

exports.addtenant = handle('addtenant', async function (req, res) {
    var b = req.body;
    if (blank(b.tenant_name) || blank(b.owner_name) || blank(b.owner_mobile_number) || blank(b.admin_pwd)) {
        throw fail('Tenant name, owner name, owner mobile and admin password are required');
    }

    var result = await withTransaction(async function (tq) {
        // Tenant admin login looks users up by mobile number alone, so it must be unique platform-wide.
        var dupMobile = await tq("SELECT id FROM admin_users_t WHERE mobile_number = ? AND d_in = 0", [b.owner_mobile_number]);
        if (dupMobile.length) throw fail('An admin login already exists with this mobile number', 300);

        var businessType = await resolveBusinessType(tq, b);

        var ins = await tq("INSERT INTO tenants (tenant_name, owner_name, owner_mobile_number, owner_email, business_type, business_type_id, " +
            "business_address, partner_id, onboarding_status, active_status, i_ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NOW())",
            [b.tenant_name, b.owner_name, b.owner_mobile_number, orNull(b.owner_email), businessType.code, businessType.id,
                orNull(b.business_address), orNull(b.partner_id)]);
        var tenantId = ins.insertId;
        // The code is always generated here — never accepted from the client. Derived
        // from the auto_increment id, so it is unique by construction with no lock
        // contention, and `uk_tenants_code` is the backstop. Deleting a tenant leaves
        // a gap rather than reusing a code.
        await tq("UPDATE tenants SET tenant_unique_code = CONCAT('TEN', LPAD(id, 6, '0')) WHERE id = ?", [tenantId]);

        await tq("INSERT INTO tenant_settings (tenant_id, currency_code, currency_symbol, timezone, support_email, support_phone, i_ts) " +
            "VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [tenantId, b.currency_code || 'INR', b.currency_symbol || '₹', b.timezone || 'Asia/Kolkata', orNull(b.support_email), orNull(b.support_phone)]);
        // A new tenant is COD-only. Online payments stay off until the tenant saves
        // their own gateway credentials, so no gateway row is created here.
        await tq("INSERT INTO tenant_charge_settings (tenant_id, cod_enabled, i_ts) VALUES (?, 1, NOW())", [tenantId]);
        // Optional first service location, so a new tenant's dashboard is not empty
        // and the Location column on the tenant list means something straight away.
        // `country`, `max_delivery_service_km` and `active_status` take their column
        // defaults; the tenant manages every further location from their own
        // Locations module, which stays the only editor of this table.
        if (!blank(b.city)) {
            await tq("INSERT INTO locations (tenant_id, city, area, pincode, state, i_ts) VALUES (?, ?, ?, ?, ?, NOW())",
                [tenantId, String(b.city).trim(), orNull(b.area), orNull(b.pincode), orNull(b.state)]);
        }
        // Tenant admin Settings page only UPDATEs branding, so the row must exist
        var brand = brandingFrom(b);
        await tq("INSERT INTO tenant_branding (tenant_id, brand_scope, " + BRANDING_COLUMNS.join(', ') + ", i_ts) " +
            "VALUES (?, 'admin_dashboard', " + BRANDING_COLUMNS.map(function () { return '?'; }).join(', ') + ", NOW())",
            [tenantId].concat(BRANDING_COLUMNS.map(function (c) { return brand[c]; })));
        // tenants.logo_image / favicon_image mirror branding for the readers that use them.
        if (brand.logo_light) await tq("UPDATE tenants SET logo_image = ? WHERE id = ?", [brand.logo_light, tenantId]);
        if (brand.favicon) await tq("UPDATE tenants SET favicon_image = ? WHERE id = ?", [brand.favicon, tenantId]);
        await saveDomain(tq, tenantId, b);

        // Owner login for the tenant admin dashboard, with full module access (same shape as seed_admin.sql)
        var adminIns = await tq("INSERT INTO admin_users_t (tenant_id, name, mobile_number, email, pwd, designation, login_status, i_ts) " +
            "VALUES (?, ?, ?, ?, ?, 'Admin', 0, NOW())",
            [tenantId, b.owner_name, b.owner_mobile_number, orNull(b.owner_email), b.admin_pwd]);
        await tq("INSERT INTO admin_user_permissions (admin_users_t_id, admin_main_module_id, admin_sub_module_id, can_view, can_add, can_edit, can_delete, i_ts) " +
            "SELECT ?, m.id, s.id, 1, 1, 1, 1, NOW() FROM admin_main_module m " +
            "LEFT JOIN admin_sub_module s ON s.admin_main_module_id = m.id AND s.is_active = 1 AND s.d_in = 0 " +
            "WHERE m.is_active = 1 AND m.d_in = 0", [adminIns.insertId]);

        for (var i = 0; i < PROVISIONING_STEPS.length; i++) {
            await tq("INSERT INTO tenant_provisioning (tenant_id, step_name, step_status, i_ts) VALUES (?, ?, 0, NOW())", [tenantId, PROVISIONING_STEPS[i]]);
        }

        if (!blank(b.plan_id)) await insertSubscription(tq, tenantId, b);
        return tenantId;
    });

    audit.log(req, { action: 'tenant_created', entity_type: 'tenant', entity_id: result, tenant_id: result, new_value: { tenant_name: b.tenant_name, plan_id: b.plan_id || null, partner_id: b.partner_id || null } });
    await markEnquiryConverted(req, b.enquiry_id, 'converted_tenant_id', result);
    return res.json({ status: 200, message: 'Tenant created successfully', insertId: result });
});

exports.updatetenant = handle('updatetenant', async function (req, res) {
    var b = req.body;
    if (blank(b.id) || blank(b.tenant_name) || blank(b.owner_name) || blank(b.owner_mobile_number)) {
        throw fail('Tenant name, owner name and owner mobile are required');
    }
    var old = await q("SELECT * FROM tenants WHERE id = ? AND d_in = 0", [b.id], 'updatetenant-old');
    if (!old.length) throw fail('Tenant not found');

    // tenant_unique_code is generated at creation and never editable, so it is
    // deliberately absent from this UPDATE even if the client sends one.
    var businessType = await resolveBusinessType(q, b);
    await q("UPDATE tenants SET tenant_name = ?, owner_name = ?, owner_mobile_number = ?, " +
        "owner_email = ?, business_type = ?, business_type_id = ?, business_address = ?, partner_id = ? WHERE id = ?",
        [b.tenant_name, b.owner_name, b.owner_mobile_number, orNull(b.owner_email), businessType.code, businessType.id,
            orNull(b.business_address), orNull(b.partner_id), b.id], 'updatetenant');

    await withTransaction(function (tq) { return saveDomain(tq, b.id, b); });
    if (hasBranding(b)) {
        var brand = brandingFrom(b);
        var existing = await q("SELECT MIN(id) AS id FROM tenant_branding WHERE tenant_id = ? AND d_in = 0", [b.id], 'updatetenant-brand');
        if (existing[0] && existing[0].id) {
            // COALESCE so a field the form did not send keeps its stored value
            // rather than being wiped.
            var sets = BRANDING_COLUMNS.map(function (c) { return c + ' = COALESCE(?, ' + c + ')'; }).join(', ');
            await q("UPDATE tenant_branding SET " + sets + " WHERE id = ?",
                BRANDING_COLUMNS.map(function (c) { return brand[c]; }).concat([existing[0].id]), 'updatetenant-brand-upd');
        } else {
            await q("INSERT INTO tenant_branding (tenant_id, brand_scope, " + BRANDING_COLUMNS.join(', ') + ", i_ts) " +
                "VALUES (?, 'admin_dashboard', " + BRANDING_COLUMNS.map(function () { return '?'; }).join(', ') + ", NOW())",
                [b.id].concat(BRANDING_COLUMNS.map(function (c) { return brand[c]; })), 'updatetenant-brand-ins');
        }
        if (brand.logo_light) await q("UPDATE tenants SET logo_image = ? WHERE id = ?", [brand.logo_light, b.id], 'updatetenant-logo');
        if (brand.favicon) await q("UPDATE tenants SET favicon_image = ? WHERE id = ?", [brand.favicon, b.id], 'updatetenant-favicon');
    }

    var settings = await q("SELECT MAX(id) AS id FROM tenant_settings WHERE tenant_id = ? AND d_in = 0", [b.id], 'updatetenant-settings');
    if (settings[0] && settings[0].id) {
        await q("UPDATE tenant_settings SET support_email = ?, support_phone = ?, currency_code = COALESCE(?, currency_code), timezone = COALESCE(?, timezone) WHERE id = ?",
            [orNull(b.support_email), orNull(b.support_phone), orNull(b.currency_code), orNull(b.timezone), settings[0].id], 'updatetenant-settings-upd');
    } else {
        await q("INSERT INTO tenant_settings (tenant_id, currency_code, timezone, support_email, support_phone, i_ts) VALUES (?, ?, ?, ?, ?, NOW())",
            [b.id, b.currency_code || 'INR', b.timezone || 'Asia/Kolkata', orNull(b.support_email), orNull(b.support_phone)], 'updatetenant-settings-ins');
    }

    var o = old[0];
    audit.log(req, {
        action: 'tenant_updated', entity_type: 'tenant', entity_id: Number(b.id), tenant_id: Number(b.id),
        old_value: { tenant_name: o.tenant_name, owner_name: o.owner_name, owner_mobile_number: o.owner_mobile_number, partner_id: o.partner_id, business_type: o.business_type },
        new_value: { tenant_name: b.tenant_name, owner_name: b.owner_name, owner_mobile_number: b.owner_mobile_number, partner_id: orNull(b.partner_id), business_type: businessType.code }
    });
    return res.json({ status: 200, message: 'Tenant updated successfully' });
});

exports.updatetenantstatus = handle('updatetenantstatus', async function (req, res) {
    var b = req.body;
    var rules = { active_status: [0, 1], onboarding_status: [0, 1, 2, 3] };
    if (!rules[b.field]) throw fail('Invalid field');
    var value = pickStatus(b.value, rules[b.field]);
    var old = await q("SELECT " + b.field + " AS v FROM tenants WHERE id = ? AND d_in = 0", [b.id], 'updatetenantstatus-old');
    if (!old.length) throw fail('Tenant not found');

    await q("UPDATE tenants SET " + b.field + " = ? WHERE id = ?", [value, b.id], 'updatetenantstatus');
    entitlements.invalidate(Number(b.id)); // active/suspended gates everything
    audit.log(req, { action: 'tenant_' + b.field + '_changed', entity_type: 'tenant', entity_id: Number(b.id), tenant_id: Number(b.id), old_value: { [b.field]: old[0].v }, new_value: { [b.field]: value } });
    return res.json({ status: 200, message: 'Status updated' });
});

exports.deletetenant = handle('deletetenant', async function (req, res) {
    var id = req.body.id;
    if (blank(id)) throw fail('Tenant ID is required');
    await q("UPDATE tenants SET d_in = 1 WHERE id = ?", [id], 'deletetenant');
    audit.log(req, { action: 'tenant_deleted', entity_type: 'tenant', entity_id: Number(id), tenant_id: Number(id) });
    return res.json({ status: 200, message: 'Tenant deleted successfully' });
});

exports.gettenantdetails = handle('gettenantdetails', async function (req, res) {
    var id = req.body.id;
    var tenant = await q(TENANT_LIST_QRY + " AND t.id = ?", [id], 'tenantdetails');
    if (!tenant.length) throw fail('Tenant not found');

    var results = await Promise.all([
        q("SELECT id, name, mobile_number, email, designation, login_status, i_ts FROM admin_users_t WHERE tenant_id = ? AND d_in = 0 ORDER BY id", [id], 'td-admins'),
        q("SELECT id, step_name, step_status, completed_at, remarks FROM tenant_provisioning WHERE tenant_id = ? AND d_in = 0 ORDER BY id", [id], 'td-prov'),
        q("SELECT s.id, s.plan_id, pl.plan_name, s.billing_cycle, s.start_date, s.end_date, s.auto_renew, s.status, s.i_ts, " +
            "(SELECT IFNULL(SUM(bt.amount),0) FROM billing_transactions bt WHERE bt.tenant_subscription_id = s.id AND bt.payment_status = 1 AND bt.d_in = 0) AS paid_amount " +
            "FROM tenant_subscriptions s LEFT JOIN plans pl ON pl.id = s.plan_id WHERE s.tenant_id = ? AND s.d_in = 0 ORDER BY s.id DESC", [id], 'td-subs'),
        q("SELECT id, subdomain, custom_domain, ssl_status, is_primary FROM tenant_domains WHERE tenant_id = ? AND d_in = 0", [id], 'td-domains'),
        q("SELECT id, feature_key, is_enabled FROM tenant_features WHERE tenant_id = ? AND d_in = 0", [id], 'td-features'),
        q("SELECT a.id, a.action, a.entity_type, a.i_ts, a.actor_type FROM audit_logs a WHERE a.tenant_id = ? AND a.d_in = 0 ORDER BY a.i_ts DESC LIMIT 15", [id], 'td-activity'),
        q("SELECT COUNT(*) AS cnt FROM dev_support_tickets t LEFT JOIN admin_users_t au ON IFNULL(t.raised_by_type,'') <> 'super_admin' AND au.id = t.raised_by " +
            "WHERE COALESCE(t.tenant_id, au.tenant_id) = ? AND t.d_in = 0 AND t.dev_status IN (0,1,2)", [id], 'td-tickets'),
        q("SELECT brand_scope, logo_light, logo_dark, logo_icon, login_bg_image, favicon, primary_color, secondary_color, " +
            "sidebar_color, header_color, button_color, font_family FROM tenant_branding WHERE tenant_id = ? AND d_in = 0 ORDER BY id", [id], 'td-branding'),
        q(PLAN_FEATURES_QRY + " AND pf.plan_id = ? ORDER BY f.feature_name", [tenant[0].plan_id || 0], 'td-features'),
        q("SELECT i.invoice_number, i.invoice_date, i.total_amount, bt.payment_status, bt.payment_gateway FROM invoices i " +
            "INNER JOIN billing_transactions bt ON bt.id = i.billing_transaction_id WHERE i.tenant_id = ? AND i.d_in = 0 ORDER BY i.id DESC LIMIT 10", [id], 'td-invoices')
    ]);

    var payment_modes = await paymentModesFor(id);

    return res.json({
        status: 200,
        data: Object.assign(tenant[0], {
            admin_users: results[0], provisioning: results[1], subscriptions: results[2],
            domains: results[3], features: results[4], activity: results[5],
            open_tickets: results[6][0] ? results[6][0].cnt : 0,
            branding: results[7], package_features: results[8], invoices: results[9],
            payment_modes: payment_modes
        })
    });
});

// ---------------------------------------------------------------------------
// TENANT PAYMENT MODES
//
// A new tenant is COD-only. Online is unlocked by the tenant saving gateway
// credentials in their own dashboard, so "online enabled" is derived from
// `payment_gateway_settings` rather than stored — the same rule dashboard_api
// applies, kept in one shape on both sides.
// ---------------------------------------------------------------------------
var GATEWAY_HAS_KEYS = "IFNULL(g.api_key,'') <> '' AND IFNULL(g.api_secret,'') <> ''";

async function paymentModesFor(tenantId) {
    var rows = await q("SELECT " +
        "(SELECT IFNULL(MAX(c.cod_enabled),1) FROM tenant_charge_settings c WHERE c.tenant_id = ? AND IFNULL(c.d_in,0) = 0) AS cod_enabled, " +
        "(SELECT COUNT(*) FROM payment_gateway_settings g WHERE g.tenant_id = ? AND IFNULL(g.d_in,0) = 0 AND " + GATEWAY_HAS_KEYS + ") AS online_configured, " +
        "(SELECT COUNT(*) FROM payment_gateway_settings g WHERE g.tenant_id = ? AND IFNULL(g.d_in,0) = 0 AND g.is_active = 1 AND " + GATEWAY_HAS_KEYS + ") AS online_enabled, " +
        "(SELECT g.gateway_name FROM payment_gateway_settings g WHERE g.tenant_id = ? AND IFNULL(g.d_in,0) = 0 ORDER BY g.id DESC LIMIT 1) AS gateway_name",
        [tenantId, tenantId, tenantId, tenantId], 'paymentmodes');
    var r = rows[0] || {};
    return {
        cod_enabled: Number(r.cod_enabled) === 1,
        online_configured: Number(r.online_configured) > 0,
        online_enabled: Number(r.online_enabled) > 0,
        gateway_name: r.gateway_name || null
    };
}

/**
 * Super Admin may switch COD, and may revoke online access. It deliberately
 * cannot *grant* online: that still requires the tenant's own credentials, so
 * there is no way to put a tenant into a state where online is on but unusable.
 * Gateway secrets are never read or returned here.
 */
/**
 * The tenant's resolved entitlements plus the whole catalogue, so Super Admin can
 * see what the package grants and what has been overridden on top.
 */
exports.gettenantentitlements = handle('gettenantentitlements', async function (req, res) {
    var id = req.body.id;

    if (blank(id)) throw fail('Tenant ID is required');

    var resolved = await new Promise(function (resolve, reject) {
        entitlements.getTenantEntitlements(id, function (err, value) {
            if (err) reject(err);
            else resolve(value);
        });
    });

    var catalog = await q(
        "SELECT id, feature_key, feature_name, module, description, " +
        "is_paid, is_implemented, limit_unit, sort_order " +
        "FROM features " +
        "WHERE d_in = 0 AND is_active = 1 " +
        "ORDER BY sort_order, feature_name",
        [],
        'te-catalog'
    );

    var overrides = await q(
        "SELECT feature_id, feature_key, is_enabled, limit_value, note " +
        "FROM tenant_features " +
        "WHERE tenant_id = ? AND d_in = 0",
        [id],
        'te-overrides'
    );

    return res.json({
        status: 200,
        data: {
            entitlements: resolved,
            catalog: catalog,
            overrides: overrides
        }
    });
});

/**
 * Grants, revokes or re-inherits one feature for one tenant — requirement 9 of
 * the plan: a tenant can differ from its package without a new package being
 * created. `mode` is 'grant' | 'revoke' | 'inherit'.
 */
exports.savetenantentitlement = handle('savetenantentitlement', async function (req, res) {
    var b = req.body;
    if (blank(b.id) || blank(b.feature_id)) throw fail('Tenant and feature are required');

    var tenant = await q("SELECT id FROM tenants WHERE id = ? AND d_in = 0", [b.id], 'ste-tenant');
    if (!tenant.length) throw fail('Tenant not found');
    var feature = await q("SELECT id, feature_key, feature_name, depends_on_feature_id FROM features WHERE id = ? AND d_in = 0", [b.feature_id], 'ste-feature');
    if (!feature.length) throw fail('Feature not found');

    var mode = String(b.mode || 'grant');
    if (['grant', 'revoke', 'inherit'].indexOf(mode) === -1) throw fail('Invalid mode');

    if (mode === 'inherit') {
        // Drop the override so the package decides again.
        await q("UPDATE tenant_features SET d_in = 1 WHERE tenant_id = ? AND feature_id = ?", [b.id, b.feature_id], 'ste-inherit');
    } else {
        var enabled = mode === 'grant' ? 1 : 0;
        // Granting a feature whose dependency the tenant lacks would produce a
        // capability that cannot work, so it is refused rather than half-applied.
        if (enabled && feature[0].depends_on_feature_id) {
            var dep = await q("SELECT feature_key FROM features WHERE id = ?", [feature[0].depends_on_feature_id], 'ste-dep');
            var resolved = await new Promise(function (resolve, reject) {
                entitlements.getTenantEntitlements(b.id, function (err, value) { if (err) reject(err); else resolve(value); });
            });
            var depKey = dep.length ? dep[0].feature_key : null;
            if (depKey && resolved.keys.indexOf(depKey) === -1) {
                throw fail(feature[0].feature_name + ' needs ' + depKey + ', which this tenant does not have', 300);
            }
        }
        await q("INSERT INTO tenant_features (tenant_id, feature_id, feature_key, is_enabled, limit_value, source, note, i_ts) " +
            "VALUES (?, ?, ?, ?, ?, 'override', ?, NOW()) " +
            "ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), limit_value = VALUES(limit_value), note = VALUES(note), d_in = 0",
            [b.id, b.feature_id, feature[0].feature_key, enabled, orNull(b.limit_value), orNull(b.note)], 'ste-save');
    }

    entitlements.invalidate(Number(b.id));
    audit.log(req, {
        action: 'tenant_entitlement_' + mode, entity_type: 'tenant', entity_id: Number(b.id), tenant_id: Number(b.id),
        new_value: { feature_key: feature[0].feature_key, mode: mode, limit_value: orNull(b.limit_value) }
    });

    var after = await new Promise(function (resolve, reject) {
        entitlements.getTenantEntitlements(b.id, function (err, value) { if (err) reject(err); else resolve(value); });
    });
    return res.json({ status: 200, message: 'Entitlement updated', data: after });
});

exports.updatetenantpaymentmodes = handle('updatetenantpaymentmodes', async function (req, res) {
    var b = req.body;
    if (blank(b.id)) throw fail('Tenant ID is required');
    var tenant = await q("SELECT id, tenant_name FROM tenants WHERE id = ? AND d_in = 0", [b.id], 'tpm-tenant');
    if (!tenant.length) throw fail('Tenant not found');

    var before = await paymentModesFor(b.id);

    if (b.cod_enabled !== undefined) {
        var cod = Number(b.cod_enabled) === 1 ? 1 : 0;
        if (!cod && !before.online_enabled) {
            throw fail('This tenant has no online payments, so cash on delivery cannot be switched off', 300);
        }
        var updated = await q("UPDATE tenant_charge_settings SET cod_enabled = ? WHERE tenant_id = ? AND IFNULL(d_in,0) = 0", [cod, b.id], 'tpm-cod');
        if (!updated.affectedRows) {
            await q("INSERT INTO tenant_charge_settings (tenant_id, cod_enabled, i_ts) VALUES (?, ?, NOW())", [b.id, cod], 'tpm-cod-ins');
        }
    }

    if (b.online_enabled !== undefined) {
        var online = Number(b.online_enabled) === 1;
        if (online && !before.online_configured) {
            throw fail('The tenant must save their gateway API key and secret before online payments can be enabled', 300);
        }
        await q("UPDATE payment_gateway_settings SET is_active = ? WHERE tenant_id = ? AND IFNULL(d_in,0) = 0", [online ? 1 : 0, b.id], 'tpm-online');
    }

    // A tenant must always keep at least one way to take money, otherwise their
    // storefront silently cannot check out. Restoring COD beats refusing, so an
    // urgent gateway revocation is never blocked.
    var after = await paymentModesFor(b.id);
    var restoredCod = false;
    if (!after.cod_enabled && !after.online_enabled) {
        var fixed = await q("UPDATE tenant_charge_settings SET cod_enabled = 1 WHERE tenant_id = ? AND IFNULL(d_in,0) = 0", [b.id], 'tpm-restore');
        if (!fixed.affectedRows) {
            await q("INSERT INTO tenant_charge_settings (tenant_id, cod_enabled, i_ts) VALUES (?, 1, NOW())", [b.id], 'tpm-restore-ins');
        }
        after = await paymentModesFor(b.id);
        restoredCod = true;
    }

    audit.log(req, {
        action: 'tenant_payment_modes_changed', entity_type: 'tenant', entity_id: Number(b.id), tenant_id: Number(b.id),
        old_value: { cod_enabled: before.cod_enabled, online_enabled: before.online_enabled },
        new_value: { cod_enabled: after.cod_enabled, online_enabled: after.online_enabled, cod_restored: restoredCod }
    });
    return res.json({
        status: 200,
        message: restoredCod ? 'Payment modes updated. Cash on delivery was switched back on so the tenant can still take payment.' : 'Payment modes updated',
        data: after
    });
});

exports.updateprovisioningstep = handle('updateprovisioningstep', async function (req, res) {
    var b = req.body;
    var value = pickStatus(b.step_status, [0, 1, 2]);
    var step = await q("SELECT tenant_id, step_name FROM tenant_provisioning WHERE id = ? AND d_in = 0", [b.id], 'prov-get');
    if (!step.length) throw fail('Step not found');
    await q("UPDATE tenant_provisioning SET step_status = ?, completed_at = IF(? = 1, NOW(), NULL), remarks = COALESCE(?, remarks) WHERE id = ?",
        [value, value, orNull(b.remarks), b.id], 'prov-upd');
    audit.log(req, { action: 'provisioning_step_updated', entity_type: 'tenant_provisioning', entity_id: Number(b.id), tenant_id: step[0].tenant_id, new_value: { step: step[0].step_name, step_status: value } });
    return res.json({ status: 200, message: 'Onboarding step updated' });
});

// ---------------------------------------------------------------------------
// PARTNERS
// ---------------------------------------------------------------------------
var PARTNER_LIST_QRY = "SELECT p.id, p.partner_name, p.partner_unique_code, p.owner_name, p.owner_mobile_number, p.owner_email, " +
    "p.business_address, p.commission_type, p.commission_value, p.active_status, p.i_ts, " +
    "(SELECT COUNT(*) FROM tenants t WHERE t.partner_id = p.id AND t.d_in = 0) AS tenant_count, " +
    "(SELECT COUNT(*) FROM tenants t WHERE t.partner_id = p.id AND t.d_in = 0 AND t.active_status = 1) AS active_tenant_count, " +
    "(SELECT COUNT(*) FROM tenants t WHERE t.partner_id = p.id AND t.d_in = 0 AND t.onboarding_status = 2) AS live_tenant_count, " +
    "(SELECT COUNT(*) FROM partner_users pu WHERE pu.partner_id = p.id AND pu.d_in = 0) AS user_count, " +
    "(SELECT COUNT(*) FROM vendors v INNER JOIN tenants t ON t.id = v.tenant_id AND t.partner_id = p.id AND t.d_in = 0 WHERE v.d_in = 0) AS shop_count, " +
    "(SELECT IFNULL(SUM(" + ORDER_GMV + "),0) FROM orders o INNER JOIN vendors v ON v.id = o.vendor_id INNER JOIN tenants t ON t.id = v.tenant_id AND t.partner_id = p.id AND t.d_in = 0 WHERE o.d_in = 0) AS sales, " +
    "(SELECT IFNULL(SUM(bt.amount),0) FROM billing_transactions bt " +
    "  INNER JOIN tenant_subscriptions s ON s.id = bt.tenant_subscription_id " +
    "  INNER JOIN tenants t ON t.id = s.tenant_id AND t.partner_id = p.id " +
    "  WHERE bt.payment_status = 1 AND bt.d_in = 0) AS tenant_revenue " +
    "FROM partners p WHERE p.d_in = 0";

exports.getpartners = handle('getpartners', async function (req, res) {
    var rows = await q(PARTNER_LIST_QRY + " ORDER BY p.i_ts DESC", [], 'getpartners');
    rows.forEach(function (r) {
        // Commission estimate is only derivable for percentage agreements
        r.estimated_commission = r.commission_type === 'percentage'
            ? Math.round(Number(r.tenant_revenue) * Number(r.commission_value)) / 100 : null;
    });
    return res.json({ status: 200, data: rows });
});

function partnerParams(b) {
    return [b.partner_name, orNull(b.partner_unique_code), orNull(b.owner_name), orNull(b.owner_mobile_number), orNull(b.owner_email),
        orNull(b.business_address), b.commission_type === 'fixed' ? 'fixed' : 'percentage', num(b.commission_value, 0)];
}

exports.addpartner = handle('addpartner', async function (req, res) {
    var b = req.body;
    if (blank(b.partner_name) || blank(b.owner_mobile_number)) throw fail('Partner name and owner mobile are required');
    if (!blank(b.partner_unique_code)) {
        var dup = await q("SELECT id FROM partners WHERE partner_unique_code = ? AND d_in = 0", [b.partner_unique_code], 'addpartner-dup');
        if (dup.length) throw fail('Partner code already exists', 300);
    }
    var ins = await q("INSERT INTO partners (partner_name, partner_unique_code, owner_name, owner_mobile_number, owner_email, business_address, " +
        "commission_type, commission_value, active_status, i_ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())", partnerParams(b), 'addpartner');
    if (blank(b.partner_unique_code)) {
        await q("UPDATE partners SET partner_unique_code = CONCAT('PTR', LPAD(id, 4, '0')) WHERE id = ?", [ins.insertId], 'addpartner-code');
    }
    audit.log(req, { action: 'partner_created', entity_type: 'partner', entity_id: ins.insertId, new_value: { partner_name: b.partner_name } });
    await markEnquiryConverted(req, b.enquiry_id, 'converted_partner_id', ins.insertId);
    return res.json({ status: 200, message: 'Partner created successfully', insertId: ins.insertId });
});

exports.updatepartner = handle('updatepartner', async function (req, res) {
    var b = req.body;
    if (blank(b.id) || blank(b.partner_name) || blank(b.owner_mobile_number)) throw fail('Partner name and owner mobile are required');
    if (!blank(b.partner_unique_code)) {
        var dup = await q("SELECT id FROM partners WHERE partner_unique_code = ? AND id <> ? AND d_in = 0", [b.partner_unique_code, b.id], 'updatepartner-dup');
        if (dup.length) throw fail('Partner code already exists', 300);
    }
    var old = await q("SELECT commission_type, commission_value FROM partners WHERE id = ? AND d_in = 0", [b.id], 'updatepartner-old');
    if (!old.length) throw fail('Partner not found');
    await q("UPDATE partners SET partner_name = ?, partner_unique_code = COALESCE(?, partner_unique_code), owner_name = ?, owner_mobile_number = ?, " +
        "owner_email = ?, business_address = ?, commission_type = ?, commission_value = ? WHERE id = ?", partnerParams(b).concat([b.id]), 'updatepartner');
    audit.log(req, { action: 'partner_updated', entity_type: 'partner', entity_id: Number(b.id), old_value: old[0], new_value: { commission_type: b.commission_type, commission_value: b.commission_value } });
    return res.json({ status: 200, message: 'Partner updated successfully' });
});

exports.updatepartnerstatus = handle('updatepartnerstatus', async function (req, res) {
    var value = pickStatus(req.body.value, [0, 1]);
    await q("UPDATE partners SET active_status = ? WHERE id = ? AND d_in = 0", [value, req.body.id], 'updatepartnerstatus');
    audit.log(req, { action: 'partner_status_changed', entity_type: 'partner', entity_id: Number(req.body.id), new_value: { active_status: value } });
    return res.json({ status: 200, message: 'Status updated' });
});

exports.deletepartner = handle('deletepartner', async function (req, res) {
    var id = req.body.id;
    var assigned = await q("SELECT COUNT(*) AS cnt FROM tenants WHERE partner_id = ? AND d_in = 0", [id], 'deletepartner-check');
    if (assigned[0].cnt > 0) throw fail('This partner still has ' + assigned[0].cnt + ' tenant(s) assigned. Reassign them first.');
    await q("UPDATE partners SET d_in = 1 WHERE id = ?", [id], 'deletepartner');
    audit.log(req, { action: 'partner_deleted', entity_type: 'partner', entity_id: Number(id) });
    return res.json({ status: 200, message: 'Partner deleted successfully' });
});

exports.getpartnerdetails = handle('getpartnerdetails', async function (req, res) {
    var id = req.body.id;
    var partner = await q(PARTNER_LIST_QRY + " AND p.id = ?", [id], 'partnerdetails');
    if (!partner.length) throw fail('Partner not found');
    var tenants = await q(TENANT_LIST_QRY + " AND t.partner_id = ? ORDER BY t.i_ts DESC", [id], 'partnerdetails-tenants');
    var users = await q("SELECT id, name, mobile_number, email, role, login_status, last_login_time FROM partner_users WHERE partner_id = ? AND d_in = 0", [id], 'partnerdetails-users');
    return res.json({ status: 200, data: Object.assign(partner[0], { tenants: tenants, users: users }) });
});

// ---------------------------------------------------------------------------
// PLANS
// ---------------------------------------------------------------------------
exports.getplans = handle('getplans', async function (req, res) {
    var rows = await q("SELECT pl.*, " +
        "(SELECT COUNT(*) FROM tenant_subscriptions s WHERE s.plan_id = pl.id AND s.d_in = 0 AND s.status = 1 AND s.end_date >= CURDATE()) AS active_subscriptions, " +
        "(SELECT COUNT(*) FROM tenant_subscriptions s WHERE s.plan_id = pl.id AND s.d_in = 0 AND s.status = 0 AND s.end_date >= CURDATE()) AS trial_subscriptions, " +
        "(SELECT COUNT(*) FROM tenants t WHERE t.plan_id = pl.id AND t.d_in = 0) AS tenant_count, " +
        "(SELECT IFNULL(SUM(CASE WHEN s.billing_cycle = 'yearly' THEN pl.price_yearly / 12 ELSE pl.price_monthly END),0) " +
        "  FROM tenant_subscriptions s WHERE s.plan_id = pl.id AND s.d_in = 0 AND s.status = 1 AND s.end_date >= CURDATE()) AS mrr " +
        "FROM plans pl WHERE pl.d_in = 0 ORDER BY pl.price_monthly", [], 'getplans');
    var features = await q(PLAN_FEATURES_QRY + " ORDER BY f.feature_name", [], 'getplans-features');
    rows.forEach(function (p) { p.features = features.filter(function (f) { return f.plan_id === p.id; }); });
    return res.json({ status: 200, data: rows });
});

function planParams(b) {
    return [b.plan_name, orNull(b.plan_code), orNull(b.description), num(b.price_monthly, 0), num(b.price_yearly, 0),
        blank(b.max_vendors) ? null : num(b.max_vendors, null), blank(b.max_orders_per_month) ? null : num(b.max_orders_per_month, null), num(b.trial_days, 0)];
}

exports.addplan = handle('addplan', async function (req, res) {
    var b = req.body;
    if (blank(b.plan_name)) throw fail('Plan name is required');
    if (!blank(b.plan_code)) {
        var dup = await q("SELECT id FROM plans WHERE plan_code = ? AND d_in = 0", [b.plan_code], 'addplan-dup');
        if (dup.length) throw fail('Plan code already exists', 300);
    }
    var ins = await q("INSERT INTO plans (plan_name, plan_code, description, price_monthly, price_yearly, max_vendors, max_orders_per_month, trial_days, is_active, i_ts) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())", planParams(b), 'addplan');
    await savePlanFeatures(ins.insertId, b.features);
    audit.log(req, { action: 'plan_created', entity_type: 'plan', entity_id: ins.insertId, new_value: { plan_name: b.plan_name, price_monthly: b.price_monthly, price_yearly: b.price_yearly } });
    return res.json({ status: 200, message: 'Plan created successfully', insertId: ins.insertId });
});

exports.updateplan = handle('updateplan', async function (req, res) {
    var b = req.body;
    if (blank(b.id) || blank(b.plan_name)) throw fail('Plan name is required');
    if (!blank(b.plan_code)) {
        var dup = await q("SELECT id FROM plans WHERE plan_code = ? AND id <> ? AND d_in = 0", [b.plan_code, b.id], 'updateplan-dup');
        if (dup.length) throw fail('Plan code already exists', 300);
    }
    var old = await q("SELECT plan_name, price_monthly, price_yearly, trial_days FROM plans WHERE id = ? AND d_in = 0", [b.id], 'updateplan-old');
    if (!old.length) throw fail('Plan not found');
    await q("UPDATE plans SET plan_name = ?, plan_code = ?, description = ?, price_monthly = ?, price_yearly = ?, max_vendors = ?, " +
        "max_orders_per_month = ?, trial_days = ? WHERE id = ?", planParams(b).concat([b.id]), 'updateplan');
    await savePlanFeatures(b.id, b.features);
    audit.log(req, { action: 'plan_updated', entity_type: 'plan', entity_id: Number(b.id), old_value: old[0], new_value: { plan_name: b.plan_name, price_monthly: b.price_monthly, price_yearly: b.price_yearly, trial_days: b.trial_days } });
    return res.json({ status: 200, message: 'Plan updated successfully' });
});

exports.updateplanstatus = handle('updateplanstatus', async function (req, res) {
    entitlements.invalidate();
    var value = pickStatus(req.body.value, [0, 1]);
    await q("UPDATE plans SET is_active = ? WHERE id = ? AND d_in = 0", [value, req.body.id], 'updateplanstatus');
    audit.log(req, { action: 'plan_status_changed', entity_type: 'plan', entity_id: Number(req.body.id), new_value: { is_active: value } });
    return res.json({ status: 200, message: 'Status updated' });
});

exports.deleteplan = handle('deleteplan', async function (req, res) {
    entitlements.invalidate();
    var id = req.body.id;
    var used = await q("SELECT COUNT(*) AS cnt FROM tenant_subscriptions WHERE plan_id = ? AND d_in = 0 AND status IN (0,1) AND end_date >= CURDATE()", [id], 'deleteplan-check');
    if (used[0].cnt > 0) throw fail('This plan has ' + used[0].cnt + ' open subscription(s). Deactivate it instead.');
    await q("UPDATE plans SET d_in = 1 WHERE id = ?", [id], 'deleteplan');
    audit.log(req, { action: 'plan_deleted', entity_type: 'plan', entity_id: Number(id) });
    return res.json({ status: 200, message: 'Plan deleted successfully' });
});

// ---------------------------------------------------------------------------
// SUBSCRIPTIONS
// ---------------------------------------------------------------------------
exports.getsubscriptions = handle('getsubscriptions', async function (req, res) {
    var rows = await q("SELECT s.id, s.tenant_id, t.tenant_name, t.tenant_unique_code, t.owner_mobile_number, p.partner_name, " +
        "s.plan_id, pl.plan_name, s.billing_cycle, s.start_date, s.end_date, s.auto_renew, s.status, s.i_ts, " +
        "CASE WHEN s.billing_cycle = 'yearly' THEN pl.price_yearly ELSE pl.price_monthly END AS plan_amount, " +
        "DATEDIFF(s.end_date, CURDATE()) AS days_left, " +
        "CASE WHEN s.status IN (0,1) AND s.end_date < CURDATE() THEN 1 ELSE 0 END AS is_overdue, " +
        "(SELECT IFNULL(SUM(bt.amount),0) FROM billing_transactions bt WHERE bt.tenant_subscription_id = s.id AND bt.payment_status = 1 AND bt.d_in = 0) AS paid_amount, " +
        "(SELECT MAX(bt.paid_at) FROM billing_transactions bt WHERE bt.tenant_subscription_id = s.id AND bt.payment_status = 1 AND bt.d_in = 0) AS last_paid_at " +
        "FROM tenant_subscriptions s " +
        "INNER JOIN tenants t ON t.id = s.tenant_id AND t.d_in = 0 " +
        "LEFT JOIN partners p ON p.id = t.partner_id " +
        "LEFT JOIN plans pl ON pl.id = s.plan_id " +
        "WHERE s.d_in = 0 ORDER BY s.id DESC", [], 'getsubscriptions');
    return res.json({ status: 200, data: rows });
});

async function insertPayment(tq, subscriptionId, b) {
    var status = blank(b.payment_status) ? 1 : pickStatus(b.payment_status, [0, 1, 2, 3]);
    var amount = num(b.amount, NaN);
    if (isNaN(amount) || amount <= 0) throw fail('A valid payment amount is required');
    var ins = await tq("INSERT INTO billing_transactions (tenant_subscription_id, transaction_reference, amount, tax_amount, payment_gateway, payment_status, paid_at, i_ts) " +
        "VALUES (?, ?, ?, ?, ?, ?, " + (status === 1 ? "COALESCE(?, NOW())" : "?") + ", NOW())",
        [subscriptionId, orNull(b.transaction_reference), amount, num(b.tax_amount, 0), orNull(b.payment_gateway), status, orNull(b.paid_at)]);
    if (status === 1) await createInvoice(tq, ins.insertId);
    return ins.insertId;
}

async function createInvoice(tq, billingTransactionId) {
    var existing = await tq("SELECT id FROM invoices WHERE billing_transaction_id = ? AND d_in = 0", [billingTransactionId]);
    if (existing.length) return;
    var ins = await tq("INSERT INTO invoices (billing_transaction_id, tenant_id, invoice_date, total_amount, i_ts) " +
        "SELECT bt.id, s.tenant_id, DATE(IFNULL(bt.paid_at, NOW())), bt.amount + bt.tax_amount, NOW() " +
        "FROM billing_transactions bt INNER JOIN tenant_subscriptions s ON s.id = bt.tenant_subscription_id WHERE bt.id = ?", [billingTransactionId]);
    await tq("UPDATE invoices SET invoice_number = CONCAT('INV-', DATE_FORMAT(invoice_date, '%Y%m'), '-', LPAD(id, 5, '0')) WHERE id = ?", [ins.insertId]);
}

exports.addsubscription = handle('addsubscription', async function (req, res) {
    var b = req.body;
    if (blank(b.tenant_id) || blank(b.plan_id)) throw fail('Tenant and plan are required');
    var tenant = await q("SELECT id FROM tenants WHERE id = ? AND d_in = 0", [b.tenant_id], 'addsubscription-tenant');
    if (!tenant.length) throw fail('Tenant not found');

    var subId = await withTransaction(async function (tq) {
        var id = await insertSubscription(tq, b.tenant_id, b);
        if (!blank(b.amount)) await insertPayment(tq, id, b);
        return id;
    });
    audit.log(req, { action: 'subscription_created', entity_type: 'tenant_subscription', entity_id: subId, tenant_id: Number(b.tenant_id), new_value: { plan_id: b.plan_id, billing_cycle: b.billing_cycle, status: b.status } });
    return res.json({ status: 200, message: 'Subscription assigned successfully', insertId: subId });
});

exports.renewsubscription = handle('renewsubscription', async function (req, res) {
    var b = req.body;
    var subs = await q("SELECT * FROM tenant_subscriptions WHERE id = ? AND d_in = 0", [b.id], 'renew-get');
    if (!subs.length) throw fail('Subscription not found');
    var s = subs[0];
    var cycle = b.billing_cycle === 'yearly' || (blank(b.billing_cycle) && s.billing_cycle === 'yearly') ? 'yearly' : 'monthly';
    var planId = blank(b.plan_id) ? s.plan_id : b.plan_id;

    var newId = await withTransaction(async function (tq) {
        // Renewal continues from the current end date, or from today if already lapsed
        var start = await tq("SELECT DATE_FORMAT(GREATEST(DATE_ADD(?, INTERVAL 1 DAY), CURDATE()), '%Y-%m-%d') AS d", [s.end_date]);
        await tq("UPDATE tenant_subscriptions SET status = 2 WHERE id = ?", [s.id]);
        var id = await insertSubscription(tq, s.tenant_id, { plan_id: planId, billing_cycle: cycle, start_date: start[0].d, status: 1, auto_renew: s.auto_renew });
        if (!blank(b.amount)) await insertPayment(tq, id, b);
        return id;
    });
    audit.log(req, { action: 'subscription_renewed', entity_type: 'tenant_subscription', entity_id: newId, tenant_id: s.tenant_id, old_value: { subscription_id: s.id, end_date: s.end_date }, new_value: { plan_id: planId, billing_cycle: cycle } });
    return res.json({ status: 200, message: 'Subscription renewed successfully', insertId: newId });
});

exports.updatesubscriptionstatus = handle('updatesubscriptionstatus', async function (req, res) {
    var b = req.body;
    var old = await q("SELECT tenant_id, status, auto_renew FROM tenant_subscriptions WHERE id = ? AND d_in = 0", [b.id], 'substatus-old');
    if (!old.length) throw fail('Subscription not found');
    if (b.field === 'auto_renew') {
        var ar = pickStatus(b.value, [0, 1]);
        await q("UPDATE tenant_subscriptions SET auto_renew = ? WHERE id = ?", [ar, b.id], 'substatus-autorenew');
        audit.log(req, { action: 'subscription_auto_renew_changed', entity_type: 'tenant_subscription', entity_id: Number(b.id), tenant_id: old[0].tenant_id, old_value: { auto_renew: old[0].auto_renew }, new_value: { auto_renew: ar } });
    } else {
        var value = pickStatus(b.value, [0, 1, 2, 3]);
        await q("UPDATE tenant_subscriptions SET status = ? WHERE id = ?", [value, b.id], 'substatus');
        audit.log(req, { action: 'subscription_status_changed', entity_type: 'tenant_subscription', entity_id: Number(b.id), tenant_id: old[0].tenant_id, old_value: { status: old[0].status }, new_value: { status: value } });
    }
    return res.json({ status: 200, message: 'Subscription updated' });
});

exports.recordpayment = handle('recordpayment', async function (req, res) {
    var b = req.body;
    var subs = await q("SELECT tenant_id FROM tenant_subscriptions WHERE id = ? AND d_in = 0", [b.tenant_subscription_id], 'recordpayment-sub');
    if (!subs.length) throw fail('Subscription not found');
    var id = await withTransaction(function (tq) { return insertPayment(tq, b.tenant_subscription_id, b); });
    audit.log(req, { action: 'payment_recorded', entity_type: 'billing_transaction', entity_id: id, tenant_id: subs[0].tenant_id, new_value: { amount: b.amount, payment_status: b.payment_status, reference: b.transaction_reference } });
    return res.json({ status: 200, message: 'Payment recorded successfully', insertId: id });
});

// ---------------------------------------------------------------------------
// BILLING & INVOICES
// ---------------------------------------------------------------------------
exports.getbillingtransactions = handle('getbillingtransactions', async function (req, res) {
    var rows = await q("SELECT bt.id, bt.tenant_subscription_id, bt.transaction_reference, bt.amount, bt.tax_amount, (bt.amount + bt.tax_amount) AS total_amount, " +
        "bt.payment_gateway, bt.payment_status, bt.paid_at, bt.i_ts, " +
        "s.tenant_id, t.tenant_name, t.tenant_unique_code, s.billing_cycle, s.start_date, s.end_date, pl.plan_name, p.partner_name, " +
        "inv.invoice_number, inv.invoice_date " +
        "FROM billing_transactions bt " +
        "INNER JOIN tenant_subscriptions s ON s.id = bt.tenant_subscription_id " +
        "INNER JOIN tenants t ON t.id = s.tenant_id " +
        "LEFT JOIN plans pl ON pl.id = s.plan_id " +
        "LEFT JOIN partners p ON p.id = t.partner_id " +
        "LEFT JOIN invoices inv ON inv.billing_transaction_id = bt.id AND inv.d_in = 0 " +
        "WHERE bt.d_in = 0 ORDER BY bt.i_ts DESC", [], 'getbillingtransactions');
    return res.json({ status: 200, data: rows });
});

exports.updatebillingstatus = handle('updatebillingstatus', async function (req, res) {
    var b = req.body;
    var value = pickStatus(b.value, [0, 1, 2, 3]);
    var old = await q("SELECT bt.payment_status, s.tenant_id FROM billing_transactions bt INNER JOIN tenant_subscriptions s ON s.id = bt.tenant_subscription_id WHERE bt.id = ? AND bt.d_in = 0", [b.id], 'billingstatus-old');
    if (!old.length) throw fail('Transaction not found');
    await withTransaction(async function (tq) {
        await tq("UPDATE billing_transactions SET payment_status = ?, paid_at = IF(? = 1, IFNULL(paid_at, NOW()), paid_at) WHERE id = ?", [value, value, b.id]);
        if (value === 1) await createInvoice(tq, b.id);
    });
    audit.log(req, { action: 'payment_status_changed', entity_type: 'billing_transaction', entity_id: Number(b.id), tenant_id: old[0].tenant_id, old_value: { payment_status: old[0].payment_status }, new_value: { payment_status: value } });
    return res.json({ status: 200, message: 'Payment status updated' });
});

// ---------------------------------------------------------------------------
// ACTIVITY / AUDIT LOG
// ---------------------------------------------------------------------------
exports.getactivitylogs = handle('getactivitylogs', async function (req, res) {
    var b = req.body || {};
    var where = ["a.d_in = 0"];
    var params = [];
    if (!blank(b.from_date)) { where.push("a.i_ts >= ?"); params.push(b.from_date); }
    if (!blank(b.to_date)) { where.push("a.i_ts < DATE_ADD(?, INTERVAL 1 DAY)"); params.push(b.to_date); }
    if (!blank(b.tenant_id)) { where.push("a.tenant_id = ?"); params.push(b.tenant_id); }

    var rows = await q("SELECT a.id, a.tenant_id, t.tenant_name, a.actor_type, a.actor_id, a.action, a.entity_type, a.entity_id, " +
        "a.old_value, a.new_value, a.ip_address, a.i_ts, " +
        "CASE WHEN a.actor_type = 'super_admin' THEN su.name WHEN a.actor_type = 'tenant_admin' THEN au.name ELSE NULL END AS actor_name " +
        "FROM audit_logs a LEFT JOIN tenants t ON t.id = a.tenant_id " +
        "LEFT JOIN super_admin_users su ON a.actor_type = 'super_admin' AND su.id = a.actor_id " +
        "LEFT JOIN admin_users_t au ON a.actor_type = 'tenant_admin' AND au.id = a.actor_id " +
        "WHERE " + where.join(" AND ") + " ORDER BY a.i_ts DESC, a.id DESC LIMIT 2000", params, 'getactivitylogs');
    return res.json({ status: 200, data: rows });
});
