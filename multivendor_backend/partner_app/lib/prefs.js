// Partner App - per-account profile preferences.
//
// The app's Profile screens keep nothing on the device: the alert toggle lives
// in `notification_preferences`, keyed by ref_type ('vendor' /
// 'delivery_partner') and ref_id, so it follows the account onto another phone.
//
// `alert_sound` and `language` are left alone: the app plays no sounds and
// ships in English only, so neither is offered until those features exist.

var db = require('./db');

var DEFAULTS = { alerts: true };

async function load(refType, refId) {
    var row = await db.one(
        'SELECT push_enabled FROM notification_preferences WHERE ref_type = ? AND ref_id = ? AND d_in = 0 LIMIT 1',
        [refType, refId], 'prefs-load');
    if (!row) return Object.assign({}, DEFAULTS);
    return { alerts: Number(row.push_enabled) === 1 };
}

/** Writes only the keys that were sent; unknown values are ignored. */
async function save(refType, refId, patch) {
    var current = await load(refType, refId);
    var next = { alerts: typeof patch.alerts === 'boolean' ? patch.alerts : current.alerts };
    var existing = await db.one('SELECT id FROM notification_preferences WHERE ref_type = ? AND ref_id = ? AND d_in = 0 LIMIT 1',
        [refType, refId], 'prefs-find');
    if (existing) {
        await db.query('UPDATE notification_preferences SET push_enabled = ? WHERE id = ?',
            [next.alerts ? 1 : 0, existing.id], 'prefs-update');
    } else {
        await db.query(
            'INSERT INTO notification_preferences (ref_type, ref_id, push_enabled, sms_enabled, email_enabled, i_ts, d_in) ' +
            'VALUES (?, ?, ?, 1, 1, NOW(), 0)',
            [refType, refId, next.alerts ? 1 : 0], 'prefs-insert');
    }
    return next;
}

/** The choices the Profile screens offer, so the app has no list of its own. */
function options() {
    return {};
}

module.exports = { load: load, save: save, options: options };
