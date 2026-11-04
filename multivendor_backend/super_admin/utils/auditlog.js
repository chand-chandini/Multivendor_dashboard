var sqldb = require('../../config/dbconnect');
var dbutil = require('../../utils/dbutils');

function toText(value) {
    if (value === undefined || value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
}

// Fire-and-forget write to audit_logs. Never blocks or fails the calling request.
// entry: { action, entity_type, entity_id, tenant_id, old_value, new_value, actor_type, actor_id }
exports.log = function (req, entry) {
    var admin = (req && req.admin) || {};
    var forwarded = req && req.headers ? (req.headers['x-forwarded-for'] || '') : '';
    var ip = forwarded.split(',')[0].trim() || (req && req.ip) || null;

    var QRY = 'INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, entity_type, entity_id, old_value, new_value, ip_address, i_ts) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
    var params = [
        entry.tenant_id || null,
        entry.actor_type || 'super_admin',
        entry.actor_id !== undefined ? entry.actor_id : (admin.id || null),
        entry.action,
        entry.entity_type || null,
        entry.entity_id || null,
        toText(entry.old_value),
        toText(entry.new_value),
        ip
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'auditlog', function () { });
};
