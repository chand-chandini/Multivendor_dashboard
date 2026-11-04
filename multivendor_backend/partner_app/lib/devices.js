// Partner App - device tokens for push notifications.
//
// One row per device token in `partner_app_devices`. The token is unique, so
// registering a token that already exists moves it to whoever is signed in now:
// that is what makes "vendor signs in on another phone" and "two accounts share
// a phone" behave, without stale rows delivering a vendor's orders to someone
// else.

var db = require('./db');

var TYPES = ['vendor', 'delivery_partner', 'franchise'];

function refTypeFor(role) {
    return role === 'vendor' ? 'vendor' : role === 'franchise' ? 'franchise' : 'delivery_partner';
}

/** Adds or re-points a token. Returns false when the token looks wrong. */
async function register(refType, refId, tenantId, token, meta) {
    var value = String(token || '').trim();
    if (TYPES.indexOf(refType) < 0 || !refId || value.length < 20 || value.length > 255) return false;
    var deviceType = ['android', 'ios'].indexOf(meta && meta.deviceType) >= 0 ? meta.deviceType : 'android';
    var version = meta && meta.appVersion ? String(meta.appVersion).slice(0, 50) : null;

    await db.query(
        'INSERT INTO partner_app_devices (ref_type, ref_id, tenant_id, fcm_token, device_type, app_version, last_active_at, i_ts, d_in) ' +
        'VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0) ' +
        'ON DUPLICATE KEY UPDATE ref_type = VALUES(ref_type), ref_id = VALUES(ref_id), tenant_id = VALUES(tenant_id), ' +
        'device_type = VALUES(device_type), app_version = VALUES(app_version), last_active_at = NOW(), d_in = 0',
        [refType, refId, tenantId, value, deviceType, version], 'device-register');
    return true;
}

/** Called on sign-out: that phone stops receiving this account's orders. */
async function unregister(token) {
    var value = String(token || '').trim();
    if (!value) return false;
    var result = await db.query('UPDATE partner_app_devices SET d_in = 1 WHERE fcm_token = ?', [value], 'device-unregister');
    return Boolean(result.affectedRows);
}

/** Drops a token FCM has told us is dead. */
function drop(token) {
    return db.query('UPDATE partner_app_devices SET d_in = 1 WHERE fcm_token = ?', [token], 'device-drop');
}

async function tokensFor(refType, refId) {
    var rows = await db.query(
        'SELECT fcm_token FROM partner_app_devices WHERE ref_type = ? AND ref_id = ? AND d_in = 0 ORDER BY last_active_at DESC LIMIT 10',
        [refType, refId], 'device-tokens');
    return rows.map(function (r) { return r.fcm_token; });
}

module.exports = {
    register: register,
    unregister: unregister,
    drop: drop,
    tokensFor: tokensFor,
    refTypeFor: refTypeFor
};
