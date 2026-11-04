/**
 * Route guard for tenant feature entitlement.
 *
 * Mirrors the shape of `super_admin/middleware/moduleAccess.js`, but answers a
 * different question. Keep the two straight:
 *
 *   moduleAccess(path, action)  — may this *operator* touch this module? (RBAC)
 *   requireFeature('KEY')       — did this *tenant* buy this capability?
 *
 * Both can apply to one route; they are independent concerns.
 *
 * Usage — tenant admin API (`req.admin.tenant_id` comes from the JWT):
 *
 *     var requireFeature = require(appRoot + '/utils/requireFeature');
 *     router.get('/getvendors', authMiddleware, requireFeature('VENDORS'), mainCtrl.getvendors);
 *
 * Usage — partner app (`req.partner.tenant_id`), resolved automatically:
 *
 *     router.post('/savecoupon', requireAuth('vendor'), requireFeature('VENDOR_COUPONS'), vendorCtrl.savecoupon);
 *
 * Responses:
 *   401  no tenant on the request (not signed in)
 *   403  tenant lacks the feature, or is inactive/suspended
 *
 * Enforcement can be switched off globally by setting the `entitlements_enforced`
 * row in `platform_settings` to 0; the guard then allows everything through.
 */

var ent = require('./entitlements');

/** Pulls the tenant id off whichever auth middleware ran for this surface. */
function tenantIdFrom(req) {
    if (req.admin && req.admin.tenant_id) return req.admin.tenant_id;      // dashboard_api
    if (req.partner && req.partner.tenant_id) return req.partner.tenant_id; // partner_app
    if (req.tenant && req.tenant.id) return req.tenant.id;                  // public_app, when it exists
    return null;
}

module.exports = function (featureKey) {
    if (!featureKey) throw new Error('requireFeature needs a feature key');

    return function (req, res, next) {
        var tenantId = tenantIdFrom(req);
        if (!tenantId) {
            return res.status(401).json({ status: 401, message: 'Unauthorized' });
        }

        ent.validateFeatureAccess(tenantId, featureKey, function (err, verdict) {
            if (err) {
                console.error('[requireFeature] ' + featureKey, err && (err.sqlMessage || err.message || err));
                return res.json({ status: 500, message: 'Internal server error' });
            }
            if (!verdict.allowed) {
                return res.status(403).json({
                    status: 403,
                    message: verdict.message,
                    // Lets the dashboard offer an upgrade prompt for the right thing
                    // instead of a bare error.
                    feature: featureKey
                });
            }
            // Handy for controllers that need to count against a cap.
            req.featureLimit = verdict.limit;
            next();
        });
    };
};
