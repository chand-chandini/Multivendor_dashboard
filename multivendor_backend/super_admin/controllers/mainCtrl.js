var sqldb = require('../../config/dbconnect');
var dbutil = require(appRoot + '/utils/dbutils');
var jwt = require('jsonwebtoken');

var JWT_SECRET = process.env.MV_ADMIN_JWT_SECRET || 'mv-superadmin-dev-secret';
var JWT_EXPIRY = '12h';

// POST /getUserData — Login
exports.getUserData = function (req, res) {
    var mobile_number = req.body.number || req.body.mobile_number;
    var pwd = req.body.password || req.body.pwd;

    if (!mobile_number || !pwd) {
        return res.json({ status: 202, message: 'Mobile number and password are required' });
    }

    var QRY = 'SELECT * FROM super_admin_users WHERE mobile_number = ? AND d_in = 0';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [mobile_number], 'getUserData-findUser', function (err, rows) {
        if (err) {
            return res.json({ status: 500, message: 'Internal server error' });
        }
        if (!rows || rows.length === 0) {
            return res.json({ status: 202, message: 'Invalid Credentials' });
        }

        var user = rows[0];
        console.log('LOGIN USER FROM DB:', user);
        if (user.pwd !== pwd) {
            return res.json({ status: 202, message: 'Invalid Credentials' });
        }

        var token = jwt.sign(
            { admin_id: user.id, mobile: user.mobile_number, admin_type: user.admin_type },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        var updateQry = 'UPDATE super_admin_users SET last_login_time = NOW() WHERE id = ?';
        dbutil.sqlinjection(sqldb.MySQLConPool, updateQry, [user.id], 'getUserData-updateLogin', function () { });

        buildMenuTree(user.id, function (menuErr, menuTree) {
            if (menuErr) {
                return res.json({ status: 500, message: 'Error loading modules' });
            }
            delete user.pwd;
            return res.json({
                status: 200,
                usr_data: [user],
                data: menuTree,
                token: token
            });
        });
    });
};
// Update logged-in user's theme color
exports.updatetheme = function (req, res) {
    var user_id = req.admin.id;
    var theme_color = req.body.theme_color;

    if (!theme_color) {
        return res.json({
            status: 202,
            message: 'Theme color is required'
        });
    }

    var QRY = 'UPDATE admin_users_t SET theme_color = ? WHERE id = ? AND tenant_id = ?';

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [theme_color, user_id, req.admin.tenant_id],
        'updatetheme',
        function (err) {
            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Theme color updated successfully',
                theme_color: theme_color
            });
        }
    );
};
// Build sidebar menu tree for a user
function buildMenuTree(userId, callback) {
    var QRY = "SELECT m.id, m.module_name, m.module_icon, m.module_path, m.module_order, " +
        "s.id AS sub_id, s.sub_module_name, s.route_path, s.sub_module_order " +
        "FROM sa_main_module m " +
        "LEFT JOIN sa_sub_module s ON s.sa_main_module_id = m.id AND s.is_active = 1 AND IFNULL(s.d_in,0) = 0 " +
        "INNER JOIN super_admin_users u ON u.id = ? AND IFNULL(u.d_in,0) = 0 " +
        "LEFT JOIN sa_user_permissions p ON p.sa_main_module_id = m.id " +
        "AND (p.sa_sub_module_id IS NULL OR p.sa_sub_module_id = s.id) " +
        "AND p.super_admin_user_id = u.id AND p.can_view = 1 AND IFNULL(p.d_in,0) = 0 " +
        // admin_type 1 (super admin) has platform-wide access to every active module
        "WHERE m.is_active = 1 AND IFNULL(m.d_in,0) = 0 AND (u.admin_type = 1 OR p.id IS NOT NULL) " +
        "GROUP BY m.id, s.id " +
        "ORDER BY m.module_order, s.sub_module_order";

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [userId], 'buildMenuTree', function (err, rows) {
        if (err) return callback(err, null);

        var modulesMap = {};
        var modulesList = [];

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (!modulesMap[row.id]) {
                var moduleItem = {
                    id: row.id,
                    title: row.module_name,
                    path: row.module_path || null,
                    icon: row.module_icon,
                    active: false,
                    type: 'sub',
                    level: 1,
                    children: []
                };
                modulesMap[row.id] = moduleItem;
                modulesList.push(moduleItem);
            }

            if (row.sub_id) {
                modulesMap[row.id].children.push({
                    parent_id: row.id,
                    sub_id: row.sub_id,
                    title: row.sub_module_name,
                    path: row.route_path,
                    type: 'link',
                    level: 2
                });
            }
        }
        callback(null, modulesList);
    });
}

// POST /getmodulelistdetails — Get all modules/submodules with user permissions
exports.getmodulelistdetails = function (req, res) {
    var usr_id = req.body.usr_id;
    if (!usr_id) {
        return res.json({ status: 202, message: 'User ID is required' });
    }
    buildMenuTree(usr_id, function (err, menuTree) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: menuTree });
    });
};

// POST /submituserslogin — Add a new super admin user with module permissions
exports.submituserslogin = function (req, res) {
    var b = req.body;
    var name = b.name;
    var number = b.number || b.mobile_number;
    var email = b.email || '';
    var pwd = b.pwd;

    if (!name || !number || !pwd) {
        return res.json({ status: 202, message: 'Name, mobile number and password are required' });
    }

    var checkQry = 'SELECT id FROM super_admin_users WHERE mobile_number = ? AND d_in = 0';
    dbutil.sqlinjection(sqldb.MySQLConPool, checkQry, [number], 'submituserslogin-check', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        if (rows && rows.length > 0) {
            return res.json({ status: 300, message: 'Mobile number already exists' });
        }

        var insertQry = "INSERT INTO super_admin_users (name, mobile_number, email, pwd, admin_type, active_status, login_status, i_ts) VALUES (?, ?, ?, ?, 2, 1, 0, NOW())";
        dbutil.sqlinjection(sqldb.MySQLConPool, insertQry, [name, number, email, pwd], 'submituserslogin-insert', function (err, result) {
            if (err) return res.json({ status: 500, message: 'Internal server error' });

            var newUserId = result.insertId;
            var selectedModules = b.selectedmoduleslist;
            if (selectedModules && selectedModules.length > 0) {
                saveUserPermissions(newUserId, selectedModules, function () {
                    return res.json({ status: 200, message: 'User created successfully' });
                });
            } else {
                return res.json({ status: 200, message: 'User created successfully' });
            }
        });
    });
};

// Helper: save permissions from the selectedmoduleslist array
function saveUserPermissions(userId, modules, callback) {
    var deleteQry = 'DELETE FROM sa_user_permissions WHERE super_admin_user_id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, deleteQry, [userId], 'savePerms-delete', function (err) {
        if (err || !modules || modules.length === 0) return callback();

        var values = [];
        var placeholders = [];
        for (var i = 0; i < modules.length; i++) {
            var m = modules[i];
            placeholders.push('(?, ?, ?, 1, 1, 1, 1, NOW())');
            values.push(userId, m.module_id, m.id && m.id < 10000 ? m.id : null);
        }

        var insertQry = 'INSERT INTO sa_user_permissions (super_admin_user_id, sa_main_module_id, sa_sub_module_id, can_view, can_add, can_edit, can_delete, i_ts) VALUES ' + placeholders.join(', ');
        dbutil.sqlinjection(sqldb.MySQLConPool, insertQry, values, 'savePerms-insert', function () {
            callback();
        });
    });
}

// GET /getuserlist — Get all super admin users
exports.getuserlist = function (req, res) {
    var QRY = "SELECT id, name, mobile_number AS number, email, profile_image, admin_type, active_status, login_status, pwd, last_login_time, i_ts FROM super_admin_users WHERE d_in = 0";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [], 'getuserlist', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

// POST /getupdatemodules — FETCH module list with check_sub_menu flags for a user
// usr_id=0 means new user (all unchecked), usr_id>0 means existing user (checked where permission exists)
exports.getupdatemodules = function (req, res) {
    var usr_id = req.body.usr_id || 0;

    var subQry = "SELECT m.id AS module_id, m.module_name AS module_nm, m.module_icon AS icon, m.module_order, " +
        "s.id, s.sub_module_name AS label, s.route_path AS link, s.sub_module_order, " +
        "CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END AS check_sub_menu, " +
        "IFNULL(m.d_in,0) AS d_in " +
        "FROM sa_main_module m " +
        "INNER JOIN sa_sub_module s ON s.sa_main_module_id = m.id AND s.is_active = 1 AND IFNULL(s.d_in,0) = 0 " +
        "LEFT JOIN sa_user_permissions p ON p.sa_main_module_id = m.id AND p.sa_sub_module_id = s.id " +
        "AND p.super_admin_user_id = ? AND IFNULL(p.d_in,0) = 0 " +
        "WHERE m.is_active = 1 AND IFNULL(m.d_in,0) = 0";

    // Standalone modules (no sub-modules) — (m.id + 10000) as id avoids collision with sub_module IDs
    var standaloneQry = "SELECT m.id AS module_id, m.module_name AS module_nm, m.module_icon AS icon, m.module_order, " +
        "(m.id + 10000) AS id, m.module_name AS label, m.module_path AS link, 0 AS sub_module_order, " +
        "CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END AS check_sub_menu, " +
        "IFNULL(m.d_in,0) AS d_in " +
        "FROM sa_main_module m " +
        "LEFT JOIN sa_user_permissions p ON p.sa_main_module_id = m.id AND p.sa_sub_module_id IS NULL " +
        "AND p.super_admin_user_id = ? AND IFNULL(p.d_in,0) = 0 " +
        "WHERE m.is_active = 1 AND IFNULL(m.d_in,0) = 0 " +
        "AND m.id NOT IN (SELECT DISTINCT sa_main_module_id FROM sa_sub_module WHERE is_active = 1 AND IFNULL(d_in,0) = 0)";

    dbutil.sqlinjection(sqldb.MySQLConPool, subQry, [usr_id], 'getupdatemodules-sub', function (err, subRows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });

        dbutil.sqlinjection(sqldb.MySQLConPool, standaloneQry, [usr_id], 'getupdatemodules-standalone', function (err2, standaloneRows) {
            if (err2) standaloneRows = [];

            var allRows = (subRows || []).concat(standaloneRows || []);
            allRows.sort(function (a, b) {
                if (a.module_order !== b.module_order) return a.module_order - b.module_order;
                return (a.sub_module_order || 0) - (b.sub_module_order || 0);
            });
            for (var i = 0; i < allRows.length; i++) {
                allRows[i].check_sub_menu = allRows[i].check_sub_menu === 1;
            }
            return res.json({ status: 200, data: allRows });
        });
    });
};

// POST /deleteuser — Soft delete users (accepts array of IDs or single object)
exports.deleteuser = function (req, res) {
    var ids = req.body;
    if (!Array.isArray(ids)) {
        ids = req.body.user_id ? [req.body.user_id] : [req.body.id];
    }
    if (!ids || ids.length === 0) {
        return res.json({ status: 202, message: 'User ID is required' });
    }

    var placeholders = ids.map(function () { return '?'; }).join(',');
    var QRY = 'UPDATE super_admin_users SET d_in = 1 WHERE id IN (' + placeholders + ')';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, ids, 'deleteuser', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'User deleted successfully' });
    });
};

// POST /postusermenulist — Save menu/module list for a user (from edit modal)
// Receives: { modules: [...selectedmoduleslist], employeeDetails: {name, number, email, pwd, confirm_pwd} }
exports.postusermenulist = function (req, res) {
    var modules = req.body.modules;
    var details = req.body.employeeDetails;

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
        return res.json({ status: 202, message: 'Modules list is required' });
    }

    // Get user_id from first module entry
    var usr_id = modules[0].user_id;
    if (!usr_id) {
        return res.json({ status: 202, message: 'User ID is required' });
    }

    // Update user details if provided
    if (details) {
        var updateParts = [];
        var updateParams = [];
        if (details.name) { updateParts.push('name = ?'); updateParams.push(details.name); }
        if (details.number) { updateParts.push('mobile_number = ?'); updateParams.push(details.number); }
        if (details.email) { updateParts.push('email = ?'); updateParams.push(details.email); }
        if (details.pwd) { updateParts.push('pwd = ?'); updateParams.push(details.pwd); }

        if (updateParts.length > 0) {
            updateParams.push(usr_id);
            var updateQry = 'UPDATE super_admin_users SET ' + updateParts.join(', ') + ' WHERE id = ?';
            dbutil.sqlinjection(sqldb.MySQLConPool, updateQry, updateParams, 'postusermenulist-updateUser', function () { });
        }
    }

    // Save permissions
    saveUserPermissions(usr_id, modules, function () {
        return res.json({ status: 200, message: 'Permissions updated successfully' });
    });
};

// GET /getdevsupport — Get all dev support tickets
exports.getdevsupport = function (req, res) {
    var QRY = "SELECT t.*, CONCAT('DS', LPAD(t.id, 5, '0')) AS ticket_id, t.subject AS issue_title, t.description AS issue_description, " +
        "DATE_FORMAT(t.i_ts, '%d-%m-%Y') AS issue_date, tn.tenant_name, " +
        // The tenant gets its own column, so this is just the person.
        "CASE WHEN t.raised_by_type = 'super_admin' THEN IFNULL(su.name,'-') ELSE IFNULL(au.name,'-') END AS name " +
        "FROM dev_support_tickets t " +
        // raised_by_type is only set by super admin; other tickets come from the tenant admin dashboard
        "LEFT JOIN super_admin_users su ON t.raised_by_type = 'super_admin' AND su.id = t.raised_by " +
        "LEFT JOIN admin_users_t au ON IFNULL(t.raised_by_type,'') <> 'super_admin' AND au.id = t.raised_by " +
        "LEFT JOIN tenants tn ON tn.id = COALESCE(t.tenant_id, au.tenant_id) " +
        "WHERE IFNULL(t.d_in,0) = 0 ORDER BY t.i_ts DESC";

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [], 'getdevsupport', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

// POST /adddevsupport — Add a new dev support ticket
exports.adddevsupport = function (req, res) {
    var b = req.body;
    var QRY = "INSERT INTO dev_support_tickets (raised_by, raised_by_type, subject, description, priority, status, application, ticket_type, show_ind, i_ts) " +
        "VALUES (?, 'super_admin', ?, ?, ?, 0, ?, ?, ?, NOW())";
    var params = [
        req.admin.id,
        b.issue_title || b.subject,
        b.issue_description || b.description,
        b.priority || 'medium',
        b.application || null,
        b.ticket_type || 1,
        b.show_ind || 0
    ];

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'adddevsupport', function (err, result) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Ticket created successfully', insertId: result.insertId });
    });
};

// POST /updatedevstatus — Update dev_status field
exports.updatedevstatus = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET dev_status = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id], 'updatedevstatus', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Dev status updated' });
    });
};

// POST /updateadminstatus — Update admin_status field
exports.updateadminstatus = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET admin_status = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id], 'updateadminstatus', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Admin status updated' });
    });
};

// POST /updatetickettype — Update ticket_type field
exports.updatetickettype = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET ticket_type = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id], 'updatetickettype', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Ticket type updated' });
    });
};

// POST /updateticketremarks — Update remarks field
exports.updateticketremarks = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET remarks = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.remarks, req.body.id], 'updateticketremarks', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Remarks updated' });
    });
};

// POST /getusersprofile — Get user profile by user_id array
exports.getusersprofile = function (req, res) {
    var user_ids = req.body.user_id;
    if (!user_ids) return res.json({ status: 202, message: 'User ID is required' });
    if (!Array.isArray(user_ids)) user_ids = [user_ids];

    var placeholders = user_ids.map(function () { return '?'; }).join(',');
    var QRY = "SELECT id, name, mobile_number, email, profile_image, admin_type FROM super_admin_users WHERE id IN (" + placeholders + ") AND d_in = 0";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, user_ids, 'getusersprofile', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

// POST /updateuserpassword — Update user password
exports.updateuserpassword = function (req, res) {
    var user_id = req.body.user_id;
    var new_password = req.body.new_password;
    if (!user_id || !new_password) return res.json({ status: 202, message: 'User ID and new password are required' });

    var QRY = 'UPDATE super_admin_users SET pwd = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [new_password, user_id], 'updateuserpassword', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Password updated successfully' });
    });
};

// GET /getmasterdata1 — Return empty arrays (no old master data needed, keeps frontend from breaking)
exports.getmasterdata1 = function (req, res) {
    return res.json({ status: 200, data: [[], [], [], []] });
};
