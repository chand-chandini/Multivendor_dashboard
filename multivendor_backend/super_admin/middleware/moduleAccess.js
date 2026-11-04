var sqldb = require('../../config/dbconnect');
var dbutil = require('../../utils/dbutils');

var ACTION_COLUMNS = { view: 'can_view', add: 'can_add', edit: 'can_edit', delete: 'can_delete' };

// Server-side check against the same sa_user_permissions rows that build the sidebar.
// admin_type 1 (super admin) has platform-wide access; other admin types need a
// permission row on the sub module (route_path) or standalone module (module_path).
// Usage: router.get('/x', authMiddleware, moduleAccess('/masters/tenants'), ctrl.x)
module.exports = function (routePath, action) {
    var column = ACTION_COLUMNS[action || 'view'];

    return function (req, res, next) {
        if (!req.admin) {
            return res.status(401).json({ status: 401, message: 'Unauthorized' });
        }
        if (Number(req.admin.admin_type) === 1) {
            return next();
        }

        var QRY = "SELECT p.id FROM sa_user_permissions p " +
            "INNER JOIN super_admin_users u ON u.id = p.super_admin_user_id AND IFNULL(u.d_in,0) = 0 " +
            "LEFT JOIN sa_sub_module s ON s.id = p.sa_sub_module_id AND s.is_active = 1 AND IFNULL(s.d_in,0) = 0 " +
            "LEFT JOIN sa_main_module m ON m.id = p.sa_main_module_id AND m.is_active = 1 AND IFNULL(m.d_in,0) = 0 " +
            "WHERE p.super_admin_user_id = ? AND p." + column + " = 1 AND IFNULL(p.d_in,0) = 0 " +
            "AND (s.route_path = ? OR (p.sa_sub_module_id IS NULL AND m.module_path = ?)) LIMIT 1";

        dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.admin.id, routePath, routePath], 'moduleAccess', function (err, rows) {
            if (err) return res.json({ status: 500, message: 'Internal server error' });
            if (!rows || rows.length === 0) {
                return res.status(403).json({ status: 403, message: 'You do not have access to this module' });
            }
            next();
        });
    };
};
