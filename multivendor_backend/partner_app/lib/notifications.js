// Partner App - in-app notifications for vendors and delivery partners.

var db = require('./db');
var fmt = require('./format');

/** targetType is 'vendor' or 'delivery_partner' (notifications.target_type). */
async function load(tenantId, targetType, targetId) {
    var rows = await db.query(
        "SELECT * FROM notifications WHERE tenant_id = ? AND d_in = 0 AND ((target_type = ? AND (target_id = ? OR target_id IS NULL)) OR target_type = 'all') " +
        'ORDER BY COALESCE(sent_at, i_ts) DESC LIMIT 30', [tenantId, targetType, targetId], 'notifications');
    return rows.map(function (n) {
        var kind = n.notification_type === 'promo' ? 'promo' : n.notification_type === 'order' ? 'order' : 'system';
        if (/settle|payout|paid|credited/i.test(n.title + ' ' + n.message)) kind = 'payment';
        return { id: String(n.id), title: n.title, body: n.message, at: fmt.ms(n.sent_at || n.i_ts), read: Number(n.is_read) === 1, kind: kind };
    });
}

function markRead(tenantId, targetType, targetId) {
    return db.query('UPDATE notifications SET is_read = 1 WHERE tenant_id = ? AND target_type = ? AND target_id = ? AND is_read = 0',
        [tenantId, targetType, targetId], 'notifications-read');
}

function send(tenantId, targetType, targetId, title, message, type) {
    return db.query(
        'INSERT INTO notifications (tenant_id, target_type, target_id, title, message, notification_type, is_read, sent_at, i_ts, d_in) ' +
        'VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW(), 0)', [tenantId, targetType, targetId, title, message, type || 'order'], 'notifications-send');
}

module.exports = { load: load, markRead: markRead, send: send };
