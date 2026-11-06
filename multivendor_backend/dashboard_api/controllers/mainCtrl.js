var sqldb = require('../../config/dbconnect');
var dbutil = require(appRoot + '/utils/dbutils');
var jwt = require('jsonwebtoken');
var identityValidation = require('../../validators/mstrVldt');
function rejectInvalidIdentity(req, res, options) {
    options.files = req.files;
    var errors = identityValidation.validateIdentityDetails(req.body, options);
    if (!Object.keys(errors).length) return false;
    Object.keys(req.files || {}).forEach(function(field) {
        req.files[field].forEach(function(file) { deleteUploadedFile(getUploadedImagePath(file.filename)); });
    });
    res.json({ status: 202, message: Object.values(errors)[0], errors: errors });
    return true;
}


var JWT_SECRET = process.env.MV_ADMIN_JWT_SECRET || 'mv-admin-dev-secret';
var JWT_EXPIRY = '12h';
const fs = require('fs');
const path = require('path');
const { uploadsDir, legacyUploadsDir, imageBaseUrl } = require('../uploadPath');
function deleteUploadedFile(imagePath) {
    if (!imagePath) return;

    const filename = path.basename(imagePath);
    const directory = /(?:^|\/)uploads\//.test(imagePath)
        ? legacyUploadsDir
        : uploadsDir;
    const filePath = path.join(directory, filename);

    fs.unlink(filePath, function (err) {
        if (err && err.code !== 'ENOENT') {
            console.log('IMAGE DELETE ERROR:', err);
        }
    });
}
function getUploadedImagePath(filename) {
    if (!filename) return null;

    return (imageBaseUrl || '/upload_files') + '/' + filename;
}

function getPublicImageUrl(imagePath, req) {
    if (!imagePath) return null;

    if (imagePath.startsWith('data:image/')) return imagePath;

    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    const normalizedPath = imagePath.replace(/\\/g, '/');

    // Keep existing images in the legacy uploads folder.
    if (/^\/?uploads\//i.test(normalizedPath)) {
        return req.protocol + '://' + req.get('host') + '/' +
            normalizedPath.replace(/^\/+/, '');
    }

    const filename = normalizedPath.replace(/^\/?upload_files\//i, '');

    // Use the configured public image URL when available.
    if (imageBaseUrl) {
        return imageBaseUrl + '/' + filename;
    }

    return req.protocol + '://' + req.get('host') + '/upload_files/' + filename;
}

// Standalone module path mapping (modules without sub-modules)
var MODULE_PATH_MAP = {
    'Dashboard': '/dashboard',
    'Locations': '/masters/locations',
    'Categories': '/masters/categories',
    'Vendors': '/masters/vendors',
    'Products': '/masters/products',
    'Orders': '/masters/orders',
    'Customers': '/masters/customers',
    'Settlements': '/masters/vendorsettlements',
    'Settings': '/masters/settings',
    'Dev Support': '/masters/devsupport',
    'Permissions': '/permission/permissions',
    'Payments': '/masters/payment',
};

// ---------------------------------------------------------------------------
// Small value helpers used by the write endpoints. They exist so an absent or
// blank body field becomes a proper NULL / default instead of `undefined`,
// which the mysql driver would otherwise reject or coerce unpredictably.
// ---------------------------------------------------------------------------
function num(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    var n = Number(value);
    return isNaN(n) ? fallback : n;
}

function nullableNum(value) {
    if (value === undefined || value === null || value === '') return null;
    var n = Number(value);
    return isNaN(n) ? null : n;
}

function emptyToNull(value) {
    if (value === undefined || value === null || value === '') return null;
    return value;
}

// =============================================
// AUTH / LOGIN
// =============================================

// POST /getUserData — Login
exports.getUserData = function (req, res) {
    var mobile_number = req.body.number || req.body.mobile_number;
    var pwd = req.body.password || req.body.pwd;

    if (!mobile_number || !pwd) {
        return res.json({ status: 202, message: 'Mobile number and password are required' });
    }

    var QRY = 'SELECT * FROM admin_users_t WHERE mobile_number = ? AND d_in = 0';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [mobile_number], 'getUserData-findUser', function (err, rows) {
        if (err) {
            return res.json({ status: 500, message: 'Internal server error' });
        }
        if (!rows || rows.length === 0) {
            return res.json({ status: 202, message: 'Invalid Credentials' });
        }

        var user = rows[0];
        if (user.pwd !== pwd) {
            return res.json({ status: 202, message: 'Invalid Credentials' });
        }

        var token = jwt.sign(
            { admin_id: user.id, tenant_id: user.tenant_id, mobile: user.mobile_number, admin_type: user.designation },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Build menu tree, then fetch tenant info
        buildMenuTree(user.id, user.tenant_id, function (menuErr, menuTree, permissions) {
            if (menuErr) {
                return res.json({ status: 500, message: 'Error loading modules' });
            }

            // Fetch tenant settings and branding
            fetchTenantInfo(user.tenant_id, function (tenantErr, tenantInfo) {
                delete user.pwd;
                return res.json({
                    status: 200,
                    usr_data: [user],
                    data: menuTree,
                    permissions: permissions || [],
                    token: token,
                    tenant: tenantInfo || { name: '', settings: {}, branding: {} }
                });
            });
        });
    });
};
// POST /updatetheme — Update logged-in user's theme color
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
// POST /updatelogo — Update logged-in user's personal logo and website name
exports.updatelogo = function (req, res) {
    var user_id = req.admin.id;
    var profile_image = req.body.profile_image;
    var website_name = req.body.website_name;

    if (!profile_image && !website_name) {
        return res.json({
            status: 202,
            message: 'Logo or website name is required'
        });
    }

    var QRY = `
        UPDATE admin_users_t
        SET profile_image = ?, website_name = ?
        WHERE id = ? AND tenant_id = ?
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [profile_image, website_name, user_id, req.admin.tenant_id],
        'updatelogo',
        function (err) {
            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Logo and website name updated successfully',
                profile_image: profile_image,
                website_name: website_name
            });
        }
    );
};

// Fetch tenant settings + branding for theming
function fetchTenantInfo(tenantId, callback) {
    var QRY = "SELECT t.tenant_name, ts.currency_code, ts.currency_symbol, ts.timezone, ts.primary_color, ts.secondary_color, " +
        "ts.default_language, ts.support_email, ts.support_phone " +
        "FROM tenants t LEFT JOIN tenant_settings ts ON ts.tenant_id = t.id " +
        "WHERE t.id = ? AND IFNULL(t.d_in,0) = 0";

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenantId], 'fetchTenantInfo-settings', function (err, settingsRows) {
        if (err || !settingsRows || settingsRows.length === 0) {
            return callback(err, { name: '', settings: {}, branding: {} });
        }

        var row = settingsRows[0];
        var tenantName = row.tenant_name;
        var settings = {
            currency_code: row.currency_code,
            currency_symbol: row.currency_symbol,
            timezone: row.timezone,
            primary_color: row.primary_color,
            secondary_color: row.secondary_color,
            default_language: row.default_language,
            support_email: row.support_email,
            support_phone: row.support_phone
        };
var brandQRY = "SELECT logo_light, logo_dark, logo_icon, login_bg_image, favicon, primary_color, secondary_color, " +
    "sidebar_color, header_color, button_color, font_family, custom_css " +
    "FROM tenant_branding WHERE tenant_id = ? AND brand_scope = 'admin_dashboard' AND IFNULL(d_in,0) = 0";

        dbutil.sqlinjection(sqldb.MySQLConPool, brandQRY, [tenantId], 'fetchTenantInfo-branding', function (err2, brandRows) {
            var branding = {};
            if (!err2 && brandRows && brandRows.length > 0) {
                branding = brandRows[0];
            }

            callback(null, {
                name: tenantName,
                settings: settings,
                branding: branding
            });
        });
    });
}

// GET /getloginbranding — public. Branding for the sign-in page, before a user
// has any token. The tenant is resolved from the host the dashboard is served
// on (tenant_domains.custom_domain, or the left-most label against
// tenant_domains.subdomain); `?tenant=` accepts a tenant code or id so a
// non-white-label host such as localhost can still be pointed at a tenant.
// Returns status 204 when nothing matches, which tells the dashboard to fall
// back to its own default branding.
exports.getloginbranding = function (req, res) {
    var host = String(req.query.host || req.hostname || '').toLowerCase().trim();
    host = host.replace(/^https?:\/\//, '').replace(/:\d+$/, '').replace(/\/.*$/, '');
    var tenantRef = req.query.tenant ? String(req.query.tenant).trim() : '';
    var label = host.split('.')[0];

    var QRY, params;
    if (tenantRef) {
        QRY = "SELECT t.id FROM tenants t WHERE IFNULL(t.d_in,0) = 0 AND (t.tenant_unique_code = ? OR t.id = ?) LIMIT 1";
        params = [tenantRef, Number(tenantRef) || 0];
    } else {
        QRY = "SELECT d.tenant_id AS id FROM tenant_domains d " +
            "INNER JOIN tenants t ON t.id = d.tenant_id AND IFNULL(t.d_in,0) = 0 " +
            "WHERE IFNULL(d.d_in,0) = 0 AND (d.custom_domain = ? OR d.subdomain = ? OR d.subdomain = ?) " +
            "ORDER BY d.is_primary DESC, d.id LIMIT 1";
        params = [host, host, label];
    }

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'getloginbranding-resolve', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        if (!rows || rows.length === 0) {
            return res.json({ status: 204, message: 'No tenant branding for this host' });
        }

        fetchTenantInfo(rows[0].id, function (infoErr, info) {
            if (infoErr || !info) return res.json({ status: 204, message: 'No tenant branding for this host' });
            // Only what the sign-in page needs; no settings or credentials.
            return res.json({
                status: 200,
                data: {
                    tenant_id: rows[0].id,
                    name: info.name,
                    branding: info.branding || {}
                }
            });
        });
    });
};

// Build sidebar menu tree for a tenant admin user
function buildMenuTree(userId, tenantId, callback) {
    // Step 1: Get ALL modules the user has permission to view
    var permQry = "SELECT p.admin_main_module_id, p.admin_sub_module_id, p.can_view, p.can_add, p.can_edit, p.can_delete " +
        "FROM admin_user_permissions p WHERE p.admin_users_t_id = ? AND p.can_view = 1 AND IFNULL(p.d_in,0) = 0";

    dbutil.sqlinjection(sqldb.MySQLConPool, permQry, [userId], 'buildMenuTree-perms', function (err, perms) {
        if (err) return callback(err, null, null);

        if (!perms) perms = [];

        if (perms.length === 0) return callback(null, [], []);

        var allowedModuleIds = [];
        var allowedSubModuleIds = [];
        var permMap = {};
        var flatPermissions = [];

        function permKey(moduleId, subId) {
            return String(moduleId) + ':' + (subId === null || subId === undefined ? '0' : String(subId));
        }

        for (var p = 0; p < perms.length; p++) {
            var perm = perms[p];
            if (allowedModuleIds.indexOf(perm.admin_main_module_id) === -1) {
                allowedModuleIds.push(perm.admin_main_module_id);
            }
            if (perm.admin_sub_module_id) {
                allowedSubModuleIds.push(perm.admin_sub_module_id);
            }
            permMap[permKey(perm.admin_main_module_id, perm.admin_sub_module_id)] = {
                can_view: perm.can_view ? 1 : 0,
                can_add: perm.can_add ? 1 : 0,
                can_edit: perm.can_edit ? 1 : 0,
                can_delete: perm.can_delete ? 1 : 0
            };
        }

        // Step 2: Get modules + their sub-modules
        var modPlaceholders = allowedModuleIds.map(function () { return '?'; }).join(',');
        var QRY = "SELECT m.id, m.module_name, m.module_icon, m.module_order, " +
            "s.id AS sub_id, s.sub_module_name, s.route_path, s.sub_module_order " +
            "FROM admin_main_module m " +
            "LEFT JOIN admin_sub_module s ON s.admin_main_module_id = m.id AND IFNULL(s.d_in,0) = 0 " +
            "WHERE m.id IN (" + modPlaceholders + ") AND IFNULL(m.d_in,0) = 0 " +
            "ORDER BY m.module_order, s.sub_module_order";

        dbutil.sqlinjection(sqldb.MySQLConPool, QRY, allowedModuleIds, 'buildMenuTree-modules', function (err2, rows) {
            if (err2) return callback(err2, null, null);

            var modulesMap = {};
            var modulesList = [];

            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row.route_path === '/masters/deliveryslots') continue;
                
                // 1. Process the Main Module
                if (!modulesMap[row.id]) {
                    var modulePath = MODULE_PATH_MAP[row.module_name] || null;

                    var modulePerm = permMap[permKey(row.id, null)] || { can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 };
                    
                    var moduleItem = {
                        id: row.id,
                        title: row.module_name,
                        path: modulePath,
                        icon: row.module_icon,
                        active: false,
                        type: 'sub',
                        level: 1,
                        can_view: modulePerm.can_view,
                        can_add: modulePerm.can_add,
                        can_edit: modulePerm.can_edit,
                        can_delete: modulePerm.can_delete,
                        children: []
                    };
                    
                    modulesMap[row.id] = moduleItem;
                    modulesList.push(moduleItem);

                    // Add to flat permissions
                    if (modulePath) {
                        flatPermissions.push({
                            module_id: row.id,
                            sub_module_id: null,
                            module_name: row.module_name,
                            sub_module_name: null,
                            path: modulePath,
                            can_view: modulePerm.can_view,
                            can_add: modulePerm.can_add,
                            can_edit: modulePerm.can_edit,
                            can_delete: modulePerm.can_delete
                        });
                    }
                }

                                // 2. Process the Sub-Module (if it exists)
                if (row.sub_id && allowedSubModuleIds.indexOf(row.sub_id) !== -1) {
                    var subPerm = permMap[permKey(row.id, row.sub_id)] || { can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 };
                    
                    modulesMap[row.id].children.push({
                        parent_id: row.id,
                        sub_id: row.sub_id,
                        title: row.sub_module_name,
                        path: row.route_path,
                        type: 'link',
                        level: 2,
                        can_view: subPerm.can_view,
                        can_add: subPerm.can_add,
                        can_edit: subPerm.can_edit,
                        can_delete: subPerm.can_delete
                    });

                    flatPermissions.push({
                        module_id: row.id,
                        sub_module_id: row.sub_id,
                        module_name: row.module_name,
                        sub_module_name: row.sub_module_name,
                        path: row.route_path,
                        can_view: subPerm.can_view,
                        can_add: subPerm.can_add,
                        can_edit: subPerm.can_edit,
                        can_delete: subPerm.can_delete
                    });
                }
            }

            callback(null, modulesList, flatPermissions);
        });
    });
}

// =============================================
// MODULE / PERMISSION ENDPOINTS
// =============================================

// POST /getmodulelistdetails — Get all modules/submodules with user permissions
exports.getmodulelistdetails = function (req, res) {
    var usr_id = req.body.usr_id;
    if (!usr_id) {
        return res.json({ status: 202, message: 'User ID is required' });
    }
    buildMenuTree(usr_id, req.admin.tenant_id, function (err, menuTree, permissions) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: menuTree, permissions: permissions || [] });
    });
};

// POST /submituserslogin — Add a new admin user with module permissions
exports.submituserslogin = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;
    var name = b.name;
    var number = b.number || b.mobile_number;
    var email = b.email || '';
    var pwd = b.pwd;
    var designation = b.designation || '';

    if (!name || !number || !pwd) {
        return res.json({ status: 202, message: 'Name, mobile number and password are required' });
    }

    var checkQry = 'SELECT id FROM admin_users_t WHERE mobile_number = ? AND tenant_id = ? AND d_in = 0';
    dbutil.sqlinjection(sqldb.MySQLConPool, checkQry, [number, tenant_id], 'submituserslogin-check', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        if (rows && rows.length > 0) {
            return res.json({ status: 300, message: 'Mobile number already exists' });
        }

        var insertQry = "INSERT INTO admin_users_t (tenant_id, name, mobile_number, email, pwd, designation, login_status, i_ts) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())";
        dbutil.sqlinjection(sqldb.MySQLConPool, insertQry, [tenant_id, name, number, email, pwd, designation], 'submituserslogin-insert', function (err, result) {
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
    var deleteQry = 'DELETE FROM admin_user_permissions WHERE admin_users_t_id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, deleteQry, [userId], 'savePerms-delete', function (err) {
        if (err || !modules || modules.length === 0) return callback();

        var values = [];
        var placeholders = [];
        var seen = {};

        // Per-action flags are optional: callers that only select modules keep
        // the original behaviour of granting full access.
        function flag(value) {
            if (value === undefined || value === null) return 1;
            return (value === 1 || value === '1' || value === true) ? 1 : 0;
        }

        for (var i = 0; i < modules.length; i++) {
            var m = modules[i];
            // For standalone modules (id > 10000 offset, or id == module_id with no link), sub_module_id is NULL
            var subModuleId = (m.id > 10000 || (m.id == m.module_id && !m.link)) ? null : (m.id || null);
            var key = m.module_id + '-' + subModuleId;
            if (seen[key]) continue; // avoid duplicates
            seen[key] = true;
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, NOW())');
            values.push(userId, m.module_id, subModuleId, flag(m.can_view), flag(m.can_add), flag(m.can_edit), flag(m.can_delete));
        }

        if (placeholders.length === 0) return callback();

        var insertQry = 'INSERT INTO admin_user_permissions (admin_users_t_id, admin_main_module_id, admin_sub_module_id, can_view, can_add, can_edit, can_delete, i_ts) VALUES ' + placeholders.join(', ');
        dbutil.sqlinjection(sqldb.MySQLConPool, insertQry, values, 'savePerms-insert', function () {
            callback();
        });
    });
}

// GET /getuserlist — Get all admin users for this tenant
exports.getuserlist = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var QRY = "SELECT id, tenant_id, name, mobile_number AS number, email, profile_image, designation, login_status, pwd, i_ts FROM admin_users_t WHERE tenant_id = ? AND d_in = 0";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenant_id], 'getuserlist', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

// POST /getupdatemodules — FETCH module list with check_sub_menu flags for a user
exports.getupdatemodules = async function (req, res) {
    // Catalog registration belongs to the running backend's database. The normal
    // queries below still determine saved permission flags.
    var franchiseCatalog;
    try {
        franchiseCatalog = await require('../models/mainModel').franchise.ensureCatalog();
    } catch (error) {
        return res.json({ status: 500, message: 'Could not register the Franchise module catalog. Please check database access and conflicting catalog entries.' });
    }
    var usr_id = req.body.usr_id || 0;

    // Get modules WITH sub-modules
    var subQry = "SELECT m.id AS module_id, m.module_name AS module_nm, m.module_icon AS icon, m.module_order, " +
        "s.id, s.sub_module_name AS label, s.route_path AS link, s.sub_module_order, " +
        "CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END AS check_sub_menu, " +
        "IFNULL(p.can_view,1) AS can_view, IFNULL(p.can_add,1) AS can_add, IFNULL(p.can_edit,1) AS can_edit, IFNULL(p.can_delete,1) AS can_delete, " +
        "IFNULL(m.d_in,0) AS d_in " +
        "FROM admin_main_module m " +
        "INNER JOIN admin_sub_module s ON s.admin_main_module_id = m.id AND s.is_active = 1 AND IFNULL(s.d_in,0) = 0 " +
        "LEFT JOIN admin_user_permissions p ON p.admin_main_module_id = m.id AND p.admin_sub_module_id = s.id " +
        "AND p.admin_users_t_id = ? AND IFNULL(p.d_in,0) = 0 " +
        "WHERE m.is_active = 1 AND IFNULL(m.d_in,0) = 0";

    // Get standalone modules (no sub-modules) — use (m.id + 10000) as id to avoid collision with sub_module IDs
    var standaloneQry = "SELECT m.id AS module_id, m.module_name AS module_nm, m.module_icon AS icon, m.module_order, " +
"(m.id + 10000) AS id, m.module_name AS label, " +
"CASE " +
"WHEN m.module_name = 'Payments' THEN '/masters/payment' " +
"WHEN m.module_name = 'Franchise' THEN '/masters/franchise/franchise-list' " + 
"ELSE NULL " +
"END AS link, " +
"0 AS sub_module_order, " +
        "CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END AS check_sub_menu, " +
        "IFNULL(p.can_view,1) AS can_view, IFNULL(p.can_add,1) AS can_add, IFNULL(p.can_edit,1) AS can_edit, IFNULL(p.can_delete,1) AS can_delete, " +
        "IFNULL(m.d_in,0) AS d_in " +
        "FROM admin_main_module m " +
        "LEFT JOIN admin_user_permissions p ON p.admin_main_module_id = m.id AND p.admin_sub_module_id IS NULL " +
        "AND p.admin_users_t_id = ? AND IFNULL(p.d_in,0) = 0 " +
        "WHERE m.is_active = 1 AND IFNULL(m.d_in,0) = 0 " +
        "AND m.id NOT IN (SELECT DISTINCT admin_main_module_id FROM admin_sub_module WHERE is_active = 1 AND IFNULL(d_in,0) = 0)";

    dbutil.sqlinjection(sqldb.MySQLConPool, subQry, [usr_id], 'getupdatemodules-sub', function (err, subRows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });

        dbutil.sqlinjection(sqldb.MySQLConPool, standaloneQry, [usr_id], 'getupdatemodules-standalone', function (err2, standaloneRows) {
            if (err2) standaloneRows = [];

            var allRows = (subRows || []).concat(standaloneRows || []).filter(function (row) {
                return row.link !== '/masters/deliveryslots';
            });
            function respond() {
                allRows.sort(function (a, b) {
                    if (a.module_order !== b.module_order) return a.module_order - b.module_order;
                    return (a.sub_module_order || 0) - (b.sub_module_order || 0);
                });
                for (var i = 0; i < allRows.length; i++) {
                    allRows[i].check_sub_menu = allRows[i].check_sub_menu === 1;
                }
                return res.json({ status: 200, data: allRows });
            }

            var franchisePath = '/masters/franchise/franchise-list';
            var hasFranchise = allRows.some(function (row) { return row.link === franchisePath; });
            if (hasFranchise) return respond();

            // Return the registered Franchise option even if a legacy catalog query
            // misses it. Use the real catalog IDs and preserve any saved permissions.
            var franchisePermQry = 'SELECT id, can_view, can_add, can_edit, can_delete ' +
                'FROM admin_user_permissions WHERE admin_users_t_id = ? AND admin_main_module_id = ? ' +
                'AND admin_sub_module_id = ? AND IFNULL(d_in,0) = 0 LIMIT 1';
            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                franchisePermQry,
                [usr_id, franchiseCatalog.module_id, franchiseCatalog.sub_module_id],
                'getupdatemodules-franchise',
                function (permErr, permRows) {
                    if (permErr) return res.json({ status: 500, message: 'Internal server error' });
                    var permission = permRows && permRows[0];
                    allRows.push({
                        module_id: franchiseCatalog.module_id,
                        module_nm: 'Franchise',
                        id: franchiseCatalog.sub_module_id,
                        label: 'Franchise List',
                        link: franchisePath,
                        sub_module_order: 1,
                        check_sub_menu: permission ? 1 : 0,
                        can_view: permission ? permission.can_view : 1,
                        can_add: permission ? permission.can_add : 1,
                        can_edit: permission ? permission.can_edit : 1,
                        can_delete: permission ? permission.can_delete : 1
                    });
                    return respond();
                }
            );
        });
    });
};

// POST /deleteuser — Soft delete users (tenant-scoped)
// Hard delete. The admin_user_permissions rows belong to the user rather than
// being independent data, so they are removed first to avoid orphan rows.
exports.deleteuser = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var ids = req.body;
    if (!Array.isArray(ids)) {
        ids = req.body.user_id ? [req.body.user_id] : [req.body.id];
    }
    ids = (ids || []).filter(function (x) { return x !== undefined && x !== null && x !== ''; });
    if (!ids.length) {
        return res.json({ status: 202, message: 'User ID is required' });
    }

    var placeholders = ids.map(function () { return '?'; }).join(',');

    var PERM_QRY = 'DELETE p FROM admin_user_permissions p ' +
        'INNER JOIN admin_users_t u ON u.id = p.admin_users_t_id ' +
        'WHERE p.admin_users_t_id IN (' + placeholders + ') AND u.tenant_id = ?';

    dbutil.sqlinjection(sqldb.MySQLConPool, PERM_QRY, ids.concat([tenant_id]), 'deleteuser-permissions', function (permErr) {
        if (permErr) {
            console.log('DELETE USER PERMISSIONS ERROR:', permErr);
            return res.json({ status: 500, message: 'Internal server error' });
        }

        var QRY = 'DELETE FROM admin_users_t WHERE id IN (' + placeholders + ') AND tenant_id = ?';
        dbutil.sqlinjection(sqldb.MySQLConPool, QRY, ids.concat([tenant_id]), 'deleteuser', function (err, result) {
            if (err) {
                console.log('DELETE USER ERROR:', err);
                return res.json({ status: 500, message: 'Internal server error' });
            }
            if (!result || !result.affectedRows) {
                return res.json({ status: 202, message: 'User not found' });
            }
            return res.json({ status: 200, message: 'User deleted successfully', affectedRows: result.affectedRows });
        });
    });
};

// POST /postusermenulist — Save menu/module list for a user (from edit modal)
exports.postusermenulist = function (req, res) {
    var modules = req.body.modules;
    var details = req.body.employeeDetails;
    var tenant_id = req.admin.tenant_id;

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
        return res.json({ status: 202, message: 'Modules list is required' });
    }

    var usr_id = modules[0].user_id;
    if (!usr_id) {
        return res.json({ status: 202, message: 'User ID is required' });
    }

    // Update user details if provided (tenant-scoped)
    if (details) {
        var updateParts = [];
        var updateParams = [];
        if (details.name) { updateParts.push('name = ?'); updateParams.push(details.name); }
        if (details.number) { updateParts.push('mobile_number = ?'); updateParams.push(details.number); }
        if (details.email) { updateParts.push('email = ?'); updateParams.push(details.email); }
        if (details.pwd) { updateParts.push('pwd = ?'); updateParams.push(details.pwd); }
        if (details.designation) { updateParts.push('designation = ?'); updateParams.push(details.designation); }

        if (updateParts.length > 0) {
            updateParams.push(usr_id);
            updateParams.push(tenant_id);
            var updateQry = 'UPDATE admin_users_t SET ' + updateParts.join(', ') + ' WHERE id = ? AND tenant_id = ?';
            dbutil.sqlinjection(sqldb.MySQLConPool, updateQry, updateParams, 'postusermenulist-updateUser', function () { });
        }
    }

    // Save permissions
    saveUserPermissions(usr_id, modules, function () {
        return res.json({ status: 200, message: 'Permissions updated successfully' });
    });
};

// POST /getusersprofile — Get user profile by user_id (tenant-scoped)
exports.getusersprofile = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var user_ids = req.body.user_id;
    if (!user_ids) return res.json({ status: 202, message: 'User ID is required' });
    if (!Array.isArray(user_ids)) user_ids = [user_ids];

    var placeholders = user_ids.map(function () { return '?'; }).join(',');
    var params = user_ids.concat([tenant_id]);
    var QRY = "SELECT id, name, mobile_number, email, profile_image, designation FROM admin_users_t WHERE id IN (" + placeholders + ") AND tenant_id = ? AND d_in = 0";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'getusersprofile', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

// POST /updateuserpassword — Update user password (tenant-scoped)
exports.updateuserpassword = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var user_id = req.body.user_id;
    var new_password = req.body.new_password;
    if (!user_id || !new_password) return res.json({ status: 202, message: 'User ID and new password are required' });

    var QRY = 'UPDATE admin_users_t SET pwd = ? WHERE id = ? AND tenant_id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [new_password, user_id, tenant_id], 'updateuserpassword', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Password updated successfully' });
    });
};

// GET /getmasterdata1 — Return empty arrays (keeps frontend from breaking)
exports.getmasterdata1 = function (req, res) {
    return res.json({ status: 200, data: [[], [], [], []] });
};

// =============================================
// DASHBOARD
// =============================================

// GET /getDashboard — Dashboard summary counts (tenant-scoped)
exports.getDashboard = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var QRY = "SELECT " +
        "(SELECT COUNT(*) FROM locations WHERE tenant_id = ? AND IFNULL(d_in,0) = 0) AS location_count, " +
        "(SELECT COUNT(*) FROM categories WHERE tenant_id = ? AND IFNULL(d_in,0) = 0) AS category_count, " +
        "(SELECT COUNT(*) FROM vendors WHERE tenant_id = ? AND IFNULL(d_in,0) = 0) AS vendor_count, " +
        "(SELECT COUNT(*) FROM franchises WHERE tenant_id = ? AND IFNULL(d_in,0) = 0) AS franchise_count, " +
        "(SELECT COUNT(*) FROM dev_support_tickets WHERE IFNULL(d_in,0) = 0) AS total_tickets";

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenant_id, tenant_id, tenant_id, tenant_id], 'getDashboard', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows[0] || {} });
    });
};

// =============================================
// LOCATIONS
// =============================================

// POST /addlocation
exports.addlocation = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;
  console.log('========== ADD LOCATION ==========');
console.log('BODY:', req.body);
console.log('FILE:', req.file);
console.log('==================================');
if (req.file) {
    b.location_image = getUploadedImagePath(req.file.filename);
}
    var QRY = "INSERT INTO locations (tenant_id, city, area, pincode, state, country, latitude, longitude, location_image, max_delivery_service_km, active_status, i_ts) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())";
    var params = [
        tenant_id, b.city || '', b.area || '', b.pincode || '', b.state || '', b.country || '',
        b.latitude || null, b.longitude || null, b.location_image || null, b.max_delivery_service_km || 0
    ];

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'addlocation', function (err, result) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Location added successfully', insertId: result.insertId });
    });
};

// GET /getlocation
exports.getlocation = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var QRY = "SELECT * FROM locations WHERE tenant_id = ? AND IFNULL(d_in,0) = 0 ORDER BY i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getlocation',
        function (err, rows) {
            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            rows = rows.map(function (row) {
                if (row.location_image) {
                    row.location_image = getPublicImageUrl(row.location_image, req);
                }

                return row;
            });

            return res.json({
                status: 200,
                data: rows
            });
        }
    );
};
// POST /updatelocation
// POST /updatelocation
exports.updatelocation = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    console.log('========== UPDATE LOCATION ==========');
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);
    console.log('=====================================');

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Location ID is required'
        });
    }

    // No new image: update only the location details.
    if (!req.file) {
        var updateQRY =
            "UPDATE locations SET city = ?, area = ?, pincode = ?, state = ?, country = ?, " +
            "latitude = ?, longitude = ?, max_delivery_service_km = ?, active_status = ? " +
            "WHERE id = ? AND tenant_id = ?";

        var updateParams = [
            b.city || '',
            b.area || '',
            b.pincode || '',
            b.state || '',
            b.country || '',
            b.latitude || null,
            b.longitude || null,
            b.max_delivery_service_km || 0,
            b.active_status != null ? b.active_status : 1,
            b.id,
            tenant_id
        ];

        return dbutil.sqlinjection(
            sqldb.MySQLConPool,
            updateQRY,
            updateParams,
            'updatelocation',
            function (err, result) {
                if (err) {
                    console.log('UPDATE LOCATION ERROR:', err);

                    return res.json({
                        status: 500,
                        message: 'Internal server error'
                    });
                }

                return res.json({
                    status: 200,
                    message: 'Location updated successfully'
                });
            }
        );
    }

    // New image uploaded:
    // 1. Get old image path
    // 2. Update DB with new image path
    // 3. Delete old physical image
    var getOldImageQRY =
        "SELECT location_image FROM locations " +
        "WHERE id = ? AND tenant_id = ?";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getOldImageQRY,
        [b.id, tenant_id],
        'updatelocation_get_old_image',
        function (err, rows) {

            if (err) {
                console.log('GET OLD LOCATION IMAGE ERROR:', err);

                deleteUploadedFile(getUploadedImagePath(req.file.filename));

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                deleteUploadedFile(getUploadedImagePath(req.file.filename));

                return res.json({
                    status: 202,
                    message: 'Location not found'
                });
            }

            var oldImagePath = rows[0].location_image;
            var newImagePath = getUploadedImagePath(req.file.filename);

            var updateQRY =
                "UPDATE locations SET city = ?, area = ?, pincode = ?, state = ?, country = ?, " +
                "latitude = ?, longitude = ?, location_image = ?, max_delivery_service_km = ?, active_status = ? " +
                "WHERE id = ? AND tenant_id = ?";

            var updateParams = [
                b.city || '',
                b.area || '',
                b.pincode || '',
                b.state || '',
                b.country || '',
                b.latitude || null,
                b.longitude || null,
                newImagePath,
                b.max_delivery_service_km || 0,
                b.active_status != null ? b.active_status : 1,
                b.id,
                tenant_id
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                updateQRY,
                updateParams,
                'updatelocation',
                function (updateErr, result) {

                    if (updateErr) {
                        console.log('UPDATE LOCATION ERROR:', updateErr);

                        // DB update failed, remove the newly uploaded file.
                        deleteUploadedFile(newImagePath);

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (oldImagePath && oldImagePath !== newImagePath) {
                        deleteUploadedFile(oldImagePath);
                    }

                    return res.json({
                        status: 200,
                        message: 'Location updated successfully'
                    });
                }
            );
        }
    );
};
// POST /deletelocation
// Hard delete, refused while anything still points at the location, so removing
// a row can never leave vendors, partners, banners or coupons dangling.
// POST /deletelocation
exports.deletelocation = function (req, res) {

    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Location ID is required'
        });
    }

    // Get the existing image before deleting the database row.
    var getImageQRY =
        "SELECT location_image " +
        "FROM locations " +
        "WHERE id = ? " +
        "AND tenant_id = ?";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getImageQRY,
        [id, tenant_id],
        'deletelocation_get_image',
        function (err, rows) {

            if (err) {
                console.log('GET LOCATION IMAGE ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                return res.json({
                    status: 202,
                    message: 'Location not found'
                });
            }

            var imagePath = rows[0].location_image;

            var deleteQRY =
                "DELETE FROM locations " +
                "WHERE id = ? " +
                "AND tenant_id = ?";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                deleteQRY,
                [id, tenant_id],
                'deletelocation',
                function (deleteErr, result) {

                    if (deleteErr) {
                        console.log('DELETE LOCATION ERROR:', deleteErr);

                        return res.json({
                            status: 500,
                            message: 'Internal server error',
                            error: deleteErr.message
                        });
                    }

                    if (!result || !result.affectedRows) {
                        return res.json({
                            status: 202,
                            message: 'Location not found'
                        });
                    }

                    // Remove the physical image only after the DB row is deleted.
                    deleteUploadedFile(imagePath);

                    return res.json({
                        status: 200,
                        message: 'Location deleted successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};
// POST /updatelocationactivestatus
exports.updatelocationactivestatus = function (req, res) {

    var tenant_id = req.admin.tenant_id;

    var QRY = `
        UPDATE locations
        SET active_status = ?
        WHERE id = ?
          AND tenant_id = ?
    `;

    var params = [
        req.body.value,
        req.body.id,
        tenant_id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'updatelocationactivestatus',
        function (err) {

            if (err) {

                console.log('UPDATE LOCATION ACTIVE STATUS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Location active status updated successfully'
            });
        }
    );
};
// =============================================
// CATEGORIES
// =============================================

// True only for a base64 PNG/JPEG data URL (rejects plain URLs and other text)
function isImageDataUrl(value) {
    return typeof value === 'string' && /^data:image\/(png|jpe?g);base64,/i.test(value);
}
// 
// POST /addcategory
exports.addcategory = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    var categoryImage = req.file
        ? getUploadedImagePath(req.file.filename)
        : null;

    var QRY = "INSERT INTO categories " +
        "(tenant_id, parent_id, category_name, category_image, vertical, category_order, is_active, i_ts) " +
        "VALUES (?, NULL, ?, ?, ?, ?, ?, NOW())";

    var params = [
        tenant_id,
        b.category_name || '',
        categoryImage,
        emptyToNull(b.vertical),
        num(b.category_order, 0),
        b.is_active !== undefined ? b.is_active : 1
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'addcategory',
        function (err, result) {

            if (err) {
                console.log('ADD CATEGORY ERROR:', err);

                // Remove uploaded file if database insert fails
                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Category added successfully',
                insertId: result ? result.insertId : null
            });
        }
    );
};


// POST /updatecategory
exports.updatecategory = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        if (req.file) {
            deleteUploadedFile(
                getUploadedImagePath(req.file.filename)
            );
        }

        return res.json({
            status: 202,
            message: 'Category ID is required'
        });
    }

    var newCategoryImage = req.file
        ? getUploadedImagePath(req.file.filename)
        : null;

    // First get the existing image so we can delete it only
    // after the new image is successfully saved in the database.
    var getOldImageQRY =
        "SELECT category_image FROM categories " +
        "WHERE id = ? AND tenant_id = ?";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getOldImageQRY,
        [b.id, tenant_id],
        'getoldcategoryimage',
        function (err, rows) {

            if (err) {
                console.log('GET OLD CATEGORY IMAGE ERROR:', err);

                if (req.file) {
                    deleteUploadedFile(newCategoryImage);
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {

                if (req.file) {
                    deleteUploadedFile(newCategoryImage);
                }

                return res.json({
                    status: 202,
                    message: 'Category not found'
                });
            }

            var oldCategoryImage = rows[0].category_image;

            var QRY = "UPDATE categories SET " +
                "category_name = ?, " +
                "category_image = COALESCE(?, category_image), " +
                "vertical = ?, category_order = ?, is_active = ? " +
                "WHERE id = ? AND tenant_id = ?";

            var params = [
                b.category_name || '',
                newCategoryImage,
                emptyToNull(b.vertical),
                num(b.category_order, 0),
                b.is_active !== undefined ? b.is_active : 1,
                b.id,
                tenant_id
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'updatecategory',
                function (err, result) {

                    if (err) {
                        console.log('UPDATE CATEGORY ERROR:', err);

                        if (req.file) {
                            deleteUploadedFile(newCategoryImage);
                        }

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {

                        if (req.file) {
                            deleteUploadedFile(newCategoryImage);
                        }

                        return res.json({
                            status: 202,
                            message: 'Category not found'
                        });
                    }

                    // New image successfully saved.
                    // Now remove the old physical image.
                    if (req.file && oldCategoryImage) {
                        deleteUploadedFile(oldCategoryImage);
                    }

                    return res.json({
                        status: 200,
                        message: 'Category updated successfully'
                    });
                }
            );
        }
    );
};
// POST /updatecategoryactivestatus
exports.updatecategoryactivestatus = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;
    var is_active = req.body.is_active;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Category ID is required'
        });
    }

    var QRY = "UPDATE categories SET is_active = ? WHERE id = ? AND tenant_id = ?";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [is_active, id, tenant_id],
        'updatecategoryactivestatus',
        function (err) {
            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Category status updated successfully'
            });
        }
    );
};
// POST /deletecategory
// Hard delete. A parent category is only removable once nothing references it,
// mirroring the guard deletesubcategory already applies, so removing a row can
// never orphan sub-categories, products, coupons, vendors or filters.
exports.deletecategory = function (req, res) {

    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Category ID is required'
        });
    }

    // First get the existing image
    var SELECT_QRY =
        "SELECT category_image " +
        "FROM categories " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND parent_id IS NULL";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        SELECT_QRY,
        [id, tenant_id],
        'deletecategory_get_image',
        function (err, rows) {

            if (err) {
                console.log('GET CATEGORY IMAGE ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                return res.json({
                    status: 202,
                    message: 'Category not found'
                });
            }

            var oldImage = rows[0].category_image;

            var DELETE_QRY =
                "DELETE FROM categories " +
                "WHERE id = ? " +
                "AND tenant_id = ? " +
                "AND parent_id IS NULL";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                DELETE_QRY,
                [id, tenant_id],
                'deletecategory',
                function (err2, result) {

                    if (err2) {

                        console.log(
                            'DELETE CATEGORY ERROR:',
                            err2
                        );

                        return res.json({
                            status: 500,
                            message: 'Internal server error',
                            error: err2.message
                        });
                    }

                    if (!result || !result.affectedRows) {
                        return res.json({
                            status: 202,
                            message: 'Category not found'
                        });
                    }

                    // Delete the physical image after DB deletion
                    if (oldImage) {
                        deleteUploadedFile(
                            getUploadedImagePath(
                                oldImage
                                    .replace(/^\/?uploads\//, '')
                            )
                        );
                    }

                    return res.json({
                        status: 200,
                        message: 'Category deleted successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};

// Checks that parent_id is an active main category (parent_id IS NULL) of this tenant
function checkMainCategory(parent_id, tenant_id, callback) {
    var QRY = "SELECT id FROM categories WHERE id = ? AND tenant_id = ? AND parent_id IS NULL AND IFNULL(d_in,0) = 0";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [parent_id, tenant_id], 'checkMainCategory', function (err, rows) {
        if (err) return callback(err, false);
        return callback(null, rows && rows.length > 0);
    });
}

// POST /addsubcategory
exports.addsubcategory = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.parent_id) {
        if (req.file) {
            deleteUploadedFile(
                getUploadedImagePath(req.file.filename)
            );
        }

        return res.json({
            status: 202,
            message: 'Parent category ID is required'
        });
    }

    checkMainCategory(
        b.parent_id,
        tenant_id,
        function (err, isValid) {

            if (err) {
                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!isValid) {
                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 202,
                    message: 'Invalid parent category'
                });
            }

            var categoryImage = req.file
                ? getUploadedImagePath(req.file.filename)
                : null;

            var QRY = "INSERT INTO categories " +
                "(tenant_id, parent_id, category_name, category_image, vertical, category_order, is_active, i_ts) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

            var params = [
                tenant_id,
                b.parent_id,
                b.category_name || '',
                categoryImage,
                emptyToNull(b.vertical),
                num(b.category_order, 0),
                b.is_active !== undefined ? b.is_active : 1
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'addsubcategory',
                function (err2, result) {

                    if (err2) {
                        console.log(
                            'ADD SUBCATEGORY ERROR:',
                            err2
                        );

                        if (req.file) {
                            deleteUploadedFile(categoryImage);
                        }

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    return res.json({
                        status: 200,
                        message: 'Subcategory added successfully',
                        insertId: result ? result.insertId : null
                    });
                }
            );
        }
    );
};

// GET /getsubcategory
exports.getsubcategory = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var parent_id = req.query.parent_id;

    var QRY = "SELECT c.*, p.category_name AS parent_category_name " +
        "FROM categories c " +
        "LEFT JOIN categories p ON p.id = c.parent_id " +
        "WHERE c.tenant_id = ? AND c.parent_id IS NOT NULL AND IFNULL(c.d_in,0) = 0";
    var params = [tenant_id];

    if (parent_id) {
        QRY += " AND c.parent_id = ?";
        params.push(parent_id);
    }

    QRY += " ORDER BY c.category_order, c.i_ts DESC";

    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'getsubcategory', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
rows = rows.map(function (row) {
    if (row.category_image) {
        row.category_image = getPublicImageUrl(row.category_image, req);
    }

    return row;
});

return res.json({
    status: 200,
    data: rows
});
    });
};

// POST /updatesubcategory
exports.updatesubcategory = function (req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        if (req.file) {
            deleteUploadedFile(
                getUploadedImagePath(req.file.filename)
            );
        }

        return res.json({
            status: 202,
            message: 'Subcategory ID is required'
        });
    }

    if (!b.parent_id) {
        if (req.file) {
            deleteUploadedFile(
                getUploadedImagePath(req.file.filename)
            );
        }

        return res.json({
            status: 202,
            message: 'Parent category ID is required'
        });
    }

    checkMainCategory(
        b.parent_id,
        tenant_id,
        function (err, isValid) {

            if (err) {
                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!isValid) {
                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 202,
                    message: 'Invalid parent category'
                });
            }

            var newSubcategoryImage = req.file
                ? getUploadedImagePath(req.file.filename)
                : null;

            // Get the existing image before updating.
            var getOldImageQRY =
                "SELECT category_image FROM categories " +
                "WHERE id = ? AND tenant_id = ? AND parent_id IS NOT NULL";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                getOldImageQRY,
                [b.id, tenant_id],
                'getoldsubcategoryimage',
                function (err2, rows) {

                    if (err2) {
                        console.log(
                            'GET OLD SUBCATEGORY IMAGE ERROR:',
                            err2
                        );

                        if (req.file) {
                            deleteUploadedFile(newSubcategoryImage);
                        }

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!rows || !rows.length) {

                        if (req.file) {
                            deleteUploadedFile(newSubcategoryImage);
                        }

                        return res.json({
                            status: 202,
                            message: 'Subcategory not found'
                        });
                    }

                    var oldSubcategoryImage =
                        rows[0].category_image;

                    var QRY =
                        "UPDATE categories SET " +
                        "parent_id = ?, " +
                        "category_name = ?, " +
                        "category_image = COALESCE(?, category_image), " +
                        "vertical = ?, " +
                        "category_order = ?, " +
                        "is_active = ? " +
                        "WHERE id = ? " +
                        "AND tenant_id = ? " +
                        "AND parent_id IS NOT NULL";

                    var params = [
                        b.parent_id,
                        b.category_name || '',
                        newSubcategoryImage,
                        emptyToNull(b.vertical),
                        num(b.category_order, 0),
                        b.is_active !== undefined
                            ? b.is_active
                            : 1,
                        b.id,
                        tenant_id
                    ];

                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        QRY,
                        params,
                        'updatesubcategory',
                        function (err3, result) {

                            if (err3) {
                                console.log(
                                    'UPDATE SUBCATEGORY ERROR:',
                                    err3
                                );

                                if (req.file) {
                                    deleteUploadedFile(
                                        newSubcategoryImage
                                    );
                                }

                                return res.json({
                                    status: 500,
                                    message: 'Internal server error'
                                });
                            }

                            if (
                                !result ||
                                !result.affectedRows
                            ) {

                                if (req.file) {
                                    deleteUploadedFile(
                                        newSubcategoryImage
                                    );
                                }

                                return res.json({
                                    status: 202,
                                    message:
                                        'Subcategory not found'
                                });
                            }

                            // Delete old image only after successful DB update.
                            if (
                                req.file &&
                                oldSubcategoryImage
                            ) {
                                deleteUploadedFile(
                                    oldSubcategoryImage
                                );
                            }

                            return res.json({
                                status: 200,
                                message:
                                    'Subcategory updated successfully'
                            });
                        }
                    );
                }
            );
        }
    );
};

// POST /deletesubcategory
exports.deletesubcategory = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Subcategory ID is required'
        });
    }

    var CHECK_QRY =
        "SELECT " +
        "(SELECT COUNT(*) " +
        " FROM categories c " +
        " WHERE c.id = ? " +
        " AND c.tenant_id = ? " +
        " AND c.parent_id IS NOT NULL) AS found, " +

        "(SELECT COUNT(*) " +
        " FROM categories " +
        " WHERE parent_id = ? " +
        " AND IFNULL(d_in,0) = 0) AS child_categories, " +

        "(SELECT COUNT(*) " +
        " FROM products " +
        " WHERE category_id = ? " +
        " AND IFNULL(d_in,0) = 0) AS products, " +

        "(SELECT COUNT(*) " +
        " FROM coupons " +
        " WHERE category_id = ? " +
        " AND IFNULL(d_in,0) = 0) AS coupons, " +

        "(SELECT COUNT(*) " +
        " FROM catalog_filters " +
        " WHERE category_id = ? " +
        " AND IFNULL(d_in,0) = 0) AS catalog_filters, " +

        "(SELECT COUNT(*) " +
        " FROM category_attributes " +
        " WHERE category_id = ? " +
        " AND IFNULL(d_in,0) = 0) AS category_attributes";

    var checkParams = [
        id,
        tenant_id,
        id,
        id,
        id,
        id,
        id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        CHECK_QRY,
        checkParams,
        'deletesubcategory-check',
        function (err, rows) {

            if (err) {
                console.log('DELETE SUBCATEGORY CHECK ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            var r = rows[0];

            if (!r.found) {
                return res.json({
                    status: 202,
                    message: 'Subcategory not found'
                });
            }

            var usage = [];

            if (r.child_categories) {
                usage.push(r.child_categories + ' child categories');
            }

            if (r.products) {
                usage.push(r.products + ' products');
            }

            if (r.coupons) {
                usage.push(r.coupons + ' coupons');
            }

            if (r.catalog_filters) {
                usage.push(r.catalog_filters + ' catalog filters');
            }

            if (r.category_attributes) {
                usage.push(r.category_attributes + ' category attributes');
            }

            if (usage.length) {
                return res.json({
                    status: 202,
                    message:
                        'Cannot delete: this subcategory is currently used by ' +
                        usage.join(', ')
                });
            }

            // Get existing image before deleting the row
            var IMAGE_QRY =
                "SELECT category_image " +
                "FROM categories " +
                "WHERE id = ? " +
                "AND tenant_id = ? " +
                "AND parent_id IS NOT NULL";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                IMAGE_QRY,
                [id, tenant_id],
                'deletesubcategory-get-image',
                function (imageErr, imageRows) {

                    if (imageErr) {
                        console.log(
                            'GET SUBCATEGORY IMAGE ERROR:',
                            imageErr
                        );

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    var oldImage =
                        imageRows &&
                        imageRows.length
                            ? imageRows[0].category_image
                            : null;

                    var QRY =
                        'DELETE FROM categories ' +
                        'WHERE id = ? ' +
                        'AND tenant_id = ? ' +
                        'AND parent_id IS NOT NULL';

                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        QRY,
                        [id, tenant_id],
                        'deletesubcategory',
                        function (err2, result) {

                            if (err2) {
                                console.log(
                                    'DELETE SUBCATEGORY ERROR:',
                                    err2
                                );

                                return res.json({
                                    status: 500,
                                    message: 'Internal server error',
                                    error: err2.message
                                });
                            }

                            if (!result || !result.affectedRows) {
                                return res.json({
                                    status: 202,
                                    message: 'Subcategory not found'
                                });
                            }

                            // Delete physical image after DB deletion
                            if (oldImage) {
                                deleteUploadedFile(
                                    getUploadedImagePath(
                                        oldImage.replace(
                                            /^\/?uploads\//,
                                            ''
                                        )
                                    )
                                );
                            }

                            return res.json({
                                status: 200,
                                message:
                                    'Subcategory deleted successfully'
                            });
                        }
                    );
                }
            );
        }
    );
};
// =============================================
// VENDORS
// =============================================

// POST /addvendor
// POST /addvendor

// ---------------------------------------------------------------------------
// Shop Details - Payment Details are stored one row per shop in
// same pattern tenant_website_footer_settings uses. Called by addvendor and
// updatevendor so Add and Edit share one code path.
// The tenant is enforced by the caller, which has already matched the vendor
// on tenant_id before reaching here.
// ---------------------------------------------------------------------------

exports.addvendor = function (req, res) {
    console.log('ADDVENDOR FUNCTION REACHED');

    var b = req.body;
    var tenant_id = req.admin.tenant_id;
    if (rejectInvalidIdentity(req, res, { vendor: true, editing: false })) return;

    if (!b.vendor_name || !b.vendor_mobile_number) {
        if (req.files) {
            Object.keys(req.files).forEach(function (field) {
                req.files[field].forEach(function (file) {
                    deleteUploadedFile(
                        getUploadedImagePath(file.filename)
                    );
                });
            });
        }

        return res.json({
            status: 202,
            message: 'Vendor name and mobile number are required'
        });
    }

    var shopImage =
        req.files &&
        req.files.shop_image &&
        req.files.shop_image[0]
            ? getUploadedImagePath(req.files.shop_image[0].filename)
            : null;

    var shopInteriorImage1 =
        req.files &&
        req.files.shop_interior_image1 &&
        req.files.shop_interior_image1[0]
            ? getUploadedImagePath(req.files.shop_interior_image1[0].filename)
            : null;

    var shopInteriorImage2 =
        req.files &&
        req.files.shop_interior_image2 &&
        req.files.shop_interior_image2[0]
            ? getUploadedImagePath(req.files.shop_interior_image2[0].filename)
            : null;

    var agreementCopy =
        req.files &&
        req.files.agreement_copy &&
        req.files.agreement_copy[0]
            ? getUploadedImagePath(req.files.agreement_copy[0].filename)
            : null;

    var uploadedImages = [
        shopImage,
        shopInteriorImage1,
        shopInteriorImage2,
        agreementCopy
    ];

    var cleanupUploadedImages = function () {
        uploadedImages.forEach(function (imagePath) {
            if (imagePath) {
                deleteUploadedFile(imagePath);
            }
        });
    };

    var checkQry =
        'SELECT id FROM vendors ' +
        'WHERE vendor_mobile_number = ? ' +
        'AND tenant_id = ? ' +
        'AND IFNULL(d_in, 0) = 0';

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        checkQry,
        [b.vendor_mobile_number, tenant_id],
        'addvendor-check',
        function (err, rows) {
            if (err) {
                console.log('ADD VENDOR CHECK ERROR:', err.code);
                cleanupUploadedImages();

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: 'Database operation failed'
                });
            }

            if (rows && rows.length > 0) {
                cleanupUploadedImages();

                return res.json({
                    status: 300,
                    message: 'Vendor mobile number already exists'
                });
            }

            var QRY =
                'INSERT INTO vendors (' +
                'tenant_id, location_id, ' +
                'vendor_name, store_category, vendor_unique_code, ' +
                'vendor_mobile_number, vendor_mobile_number2, vendor_email, pwd, vendor_address, ' +
                'latitude, longitude, fssai_license_number, gst_number, trade_license_number, ' +
                'drug_license_number, pan_number, shop_image, shop_interior_image1, ' +
                'shop_interior_image2, agreement_copy, ' +
                'bank_account_holder, bank_account_number, bank_ifsc_code, bank_name, upi_id, ' +
                'opening_time, closing_time, weekly_holiday, ' +
                'commission_percentage, kyc_status, is_online, login_status, active_status, i_ts' +
                ') VALUES (' +
                '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ' +
                '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ' +
                '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ' +
                '?, 0, 0, 1, NOW()' +
                ')';

            var params = [
                tenant_id,
                nullableNum(b.location_id),
                b.vendor_name,
                b.store_category || null,
                b.vendor_unique_code || null,
                b.vendor_mobile_number,
                b.vendor_mobile_number2 || null,
                b.vendor_email || '',
                b.pwd || '123456',
                b.vendor_address || '',
                emptyToNull(b.latitude),
                emptyToNull(b.longitude),
                b.fssai_license_number || null,
                b.gst_number || null,
                b.trade_license_number || null,
                b.drug_license_number || null,
                b.pan_number || null,
                shopImage,
                shopInteriorImage1,
                shopInteriorImage2,
                agreementCopy,
                b.bank_account_holder || null,
                b.bank_account_number || null,
                b.bank_ifsc_code || null,
                b.bank_name || null,
                b.upi_id || null,
                emptyToNull(b.opening_time),
                emptyToNull(b.closing_time),
                emptyToNull(b.weekly_holiday),
                num(b.commission_percentage, 0),
                num(b.kyc_status, 0)
            ];

            console.log(
                'ADDVENDOR PLACEHOLDERS:',
                (QRY.match(/\?/g) || []).length
            );
            console.log(
                'ADDVENDOR PARAMETERS:',
                params.length
            );

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'addvendor',
                function (err, result) {
                    if (err) {
                        console.log('ADD VENDOR ERROR:', err.code);
                        cleanupUploadedImages();

                        return res.json({
                            status: 500,
                            message: 'Internal server error',
                            error: 'Database operation failed'
                        });
                    }

                    return res.json({
                        status: 200,
                        message: 'Vendor added successfully',
                        insertId: result.insertId
                    });
                }
            );
        }
    );
};

// POST /updatevendor
exports.updatevendor = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;
    if (rejectInvalidIdentity(req, res, { vendor: true, editing: true })) return;

    if (!b.id) {

        // Delete newly uploaded files if validation fails.
        if (req.files) {
            Object.keys(req.files).forEach(function (field) {
                req.files[field].forEach(function (file) {
                    deleteUploadedFile(
                        getUploadedImagePath(file.filename)
                    );
                });
            });
        }

        return res.json({
            status: 202,
            message: 'Vendor ID is required'
        });
    }

    // First get existing vendor images.
    var getOldImagesQRY =
        "SELECT " +
        "shop_image, " +
        "shop_interior_image1, " +
        "shop_interior_image2, " +
        "agreement_copy " +
        "FROM vendors " +
        "WHERE id = ? " +
        "AND tenant_id = ?";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getOldImagesQRY,
        [b.id, tenant_id],
        'updatevendor-get-old-images',
        function (err, rows) {

            if (err) {

                console.log(
                    'GET OLD VENDOR IMAGES ERROR:',
                    err.code
                );

                // Delete newly uploaded files.
                if (req.files) {
                    Object.keys(req.files).forEach(function (field) {
                        req.files[field].forEach(function (file) {
                            deleteUploadedFile(
                                getUploadedImagePath(file.filename)
                            );
                        });
                    });
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: 'Database operation failed'
                });
            }

            if (!rows || !rows.length) {

                // Delete newly uploaded files.
                if (req.files) {
                    Object.keys(req.files).forEach(function (field) {
                        req.files[field].forEach(function (file) {
                            deleteUploadedFile(
                                getUploadedImagePath(file.filename)
                            );
                        });
                    });
                }

                return res.json({
                    status: 202,
                    message: 'Vendor not found'
                });
            }

            var oldVendor = rows[0];

            /*
             * If a new image is uploaded, use the new image.
             * If no new image is uploaded, keep the existing image.
             */

            var shopImage =
                req.files &&
                req.files.shop_image &&
                req.files.shop_image[0]
                    ? getUploadedImagePath(
                        req.files.shop_image[0].filename
                    )
                    : oldVendor.shop_image;

            var shopInteriorImage1 =
                req.files &&
                req.files.shop_interior_image1 &&
                req.files.shop_interior_image1[0]
                    ? getUploadedImagePath(
                        req.files.shop_interior_image1[0].filename
                    )
                    : oldVendor.shop_interior_image1;

            var shopInteriorImage2 =
                req.files &&
                req.files.shop_interior_image2 &&
                req.files.shop_interior_image2[0]
                    ? getUploadedImagePath(
                        req.files.shop_interior_image2[0].filename
                    )
                    : oldVendor.shop_interior_image2;

            var agreementCopy =
                req.files &&
                req.files.agreement_copy &&
                req.files.agreement_copy[0]
                    ? getUploadedImagePath(
                        req.files.agreement_copy[0].filename
                    )
                    : oldVendor.agreement_copy;


            var QRY =
                "UPDATE vendors SET " +
                "location_id = ?, " +
                "vendor_name = ?, " +
                "store_category = ?, " +
                "vendor_unique_code = ?, " +
                "vendor_mobile_number = ?, " +
                "vendor_mobile_number2 = ?, " +
                "vendor_email = ?, " +
                "vendor_address = ?, " +
                "latitude = ?, " +
                "longitude = ?, " +
                "fssai_license_number = ?, " +
                "gst_number = ?, " +
                "trade_license_number = ?, " +
                "drug_license_number = ?, " +
                "pan_number = ?, " +
                "shop_image = ?, " +
                "shop_interior_image1 = ?, " +
                "shop_interior_image2 = ?, " +
                "agreement_copy = ?, " +
                "bank_account_holder = ?, " +
                "bank_account_number = ?, " +
                "bank_ifsc_code = ?, " +
                "bank_name = ?, " +
                "upi_id = ?, " +
                "opening_time = ?, " +
                "closing_time = ?, " +
                "weekly_holiday = ?, " +
                "commission_percentage = ?, " +
                "kyc_status = ? " +
                "WHERE id = ? " +
                "AND tenant_id = ?";


            var params = [

                nullableNum(b.location_id),

                b.vendor_name || '',
                b.store_category || null,
                b.vendor_unique_code || null,

                b.vendor_mobile_number || '',
                b.vendor_mobile_number2 || null,
                b.vendor_email || '',

                b.vendor_address || '',
                emptyToNull(b.latitude),
                emptyToNull(b.longitude),

                b.fssai_license_number || null,
                b.gst_number || null,
                b.trade_license_number || null,
                b.drug_license_number || null,
                b.pan_number || null,

                shopImage,
                shopInteriorImage1,
                shopInteriorImage2,
                agreementCopy,

                b.bank_account_holder || null,
                b.bank_account_number || null,
                b.bank_ifsc_code || null,
                b.bank_name || null,
                b.upi_id || null,

                emptyToNull(b.opening_time),
                emptyToNull(b.closing_time),
                emptyToNull(b.weekly_holiday),

                num(b.commission_percentage, 0),
                num(b.kyc_status, 0),

                b.id,
                tenant_id
            ];


            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'updatevendor',
                function (updateErr, result) {

                    if (updateErr) {

                        console.log(
                            'UPDATE VENDOR ERROR:',
                            updateErr.code
                        );

                        // Delete newly uploaded files
                        // because database update failed.
                        if (req.files) {
                            Object.keys(req.files).forEach(function (field) {
                                req.files[field].forEach(function (file) {
                                    deleteUploadedFile(
                                        getUploadedImagePath(
                                            file.filename
                                        )
                                    );
                                });
                            });
                        }

                        return res.json({
                            status: 500,
                            message: 'Internal server error',
                            error: 'Database operation failed'
                        });
                    }


                    if (!result || !result.affectedRows) {

                        // Delete newly uploaded files.
                        if (req.files) {
                            Object.keys(req.files).forEach(function (field) {
                                req.files[field].forEach(function (file) {
                                    deleteUploadedFile(
                                        getUploadedImagePath(
                                            file.filename
                                        )
                                    );
                                });
                            });
                        }

                        return res.json({
                            status: 202,
                            message: 'Vendor not found'
                        });
                    }


                    /*
                     * Database update succeeded.
                     * Now delete only the old images that were replaced.
                     */

                    if (
                        req.files &&
                        req.files.shop_image &&
                        req.files.shop_image[0] &&
                        oldVendor.shop_image &&
                        oldVendor.shop_image !== shopImage
                    ) {
                        deleteUploadedFile(
                            oldVendor.shop_image
                        );
                    }


                    if (
                        req.files &&
                        req.files.shop_interior_image1 &&
                        req.files.shop_interior_image1[0] &&
                        oldVendor.shop_interior_image1 &&
                        oldVendor.shop_interior_image1 !== shopInteriorImage1
                    ) {
                        deleteUploadedFile(
                            oldVendor.shop_interior_image1
                        );
                    }


                    if (
                        req.files &&
                        req.files.shop_interior_image2 &&
                        req.files.shop_interior_image2[0] &&
                        oldVendor.shop_interior_image2 &&
                        oldVendor.shop_interior_image2 !== shopInteriorImage2
                    ) {
                        deleteUploadedFile(
                            oldVendor.shop_interior_image2
                        );
                    }


                    if (
                        req.files &&
                        req.files.agreement_copy &&
                        req.files.agreement_copy[0] &&
                        oldVendor.agreement_copy &&
                        oldVendor.agreement_copy !== agreementCopy
                    ) {
                        deleteUploadedFile(
                            oldVendor.agreement_copy
                        );
                    }


                    return res.json({
                        status: 200,
                        message: 'Vendor updated successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};
// GET /getvendors
exports.getvendors = function (req, res) {
    var tenant_id = req.admin.tenant_id;

    var QRY = "SELECT " +
        "v.id, " +
        "v.tenant_id, " +
        "v.location_id, " +
        "v.vendor_name, " +
        "v.store_category, " +
        "v.vendor_unique_code, " +
        "v.vendor_mobile_number, " +
        "v.vendor_mobile_number2, " +
        "v.vendor_email, " +
        "v.pwd, " +
        "v.vendor_address, " +
        "v.latitude, " +
        "v.longitude, " +
        "v.fssai_license_number, " +
        "v.gst_number, " +
        "v.trade_license_number, " +
        "v.drug_license_number, " +
        "v.pan_number, " +
        "v.shop_image, " +
        "v.shop_interior_image1, " +
        "v.shop_interior_image2, " +
        "v.agreement_copy, " +
        "v.bank_account_holder, " +
        "v.bank_account_number, " +
        "v.bank_ifsc_code, " +
        "v.bank_name, " +
        "v.upi_id, " +
        "v.opening_time, " +
        "v.closing_time, " +
        "v.weekly_holiday, " +
        "v.commission_percentage, " +
        "v.vendor_rating, " +
        "v.kyc_status, " +
        "v.is_online, " +
        "v.is_busy, " +
        "v.login_status, " +
        "v.active_status, " +
        "v.i_ts, " +
        "v.d_in, " +
        "v.rates_published_on, " +
        "v.allow_substitution " +
        "FROM vendors v " +
        "WHERE v.tenant_id = ? " +
        "AND IFNULL(v.d_in, 0) = 0 " +
        "ORDER BY v.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getvendors',
        function (err, rows) {
            if (err) {
                console.log('GET VENDORS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows
            });
        }
    );
};
// POST /deletevendor
exports.deletevendor = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;
    if (!id) return res.json({ status: 202, message: 'Vendor ID is required' });

var QRY = 'DELETE FROM vendors WHERE id = ? AND tenant_id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [id, tenant_id], 'deletevendor', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Vendor deleted successfully' });
    });
};
// POST /updatevendoractivestatus
exports.updatevendoractivestatus = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var QRY = 'UPDATE vendors SET active_status = ? WHERE id = ? AND tenant_id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id, tenant_id], 'updatevendoractivestatus', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Vendor active status updated' });
    });
};
// POST /updatevendorloginstatus
exports.updatevendorloginstatus = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var QRY = 'UPDATE vendors SET login_status = ? WHERE id = ? AND tenant_id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id, tenant_id], 'updatevendorloginstatus', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Vendor login status updated' });
    });
};

// =============================================
// DEV SUPPORT
// =============================================
// GET /getdevsupport
exports.getdevsupport = function (req, res) {
    var QRY = "SELECT " +
        "t.id, " +
        "t.raised_by, " +
        "t.subject, " +
        "t.description, " +
        "t.application, " +
        "t.ticket_type, " +
        "t.dev_status, " +
        "t.admin_status, " +
        "t.remarks, " +
        "t.image, " +
        "t.i_ts, " +
        "u.name AS entry_by " +
        "FROM dev_support_tickets t " +
        "LEFT JOIN admin_users_t u ON u.id = t.raised_by " +
        "WHERE IFNULL(t.d_in,0) = 0 " +
        "ORDER BY t.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [],
        'getdevsupport',
        function (err, rows) {
            if (err) {
                console.error('getdevsupport error:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            rows = rows.map(function (row) {
                return {
             ...row,
             image: getPublicImageUrl(row.image, req)
                };
            });

            return res.json({
                status: 200,
                data: rows
            });
        }
    );
};


// POST /updatedevsupport
exports.updatedevsupport = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {

        if (req.file) {
            deleteUploadedFile(
                getUploadedImagePath(req.file.filename)
            );
        }

        return res.json({
            status: 202,
            message: 'Ticket ID is required'
        });
    }

    var getOldImageQRY =
        "SELECT image " +
        "FROM dev_support_tickets " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND d_in = 0";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getOldImageQRY,
        [b.id, tenant_id],
        'updatedevsupport-get-old-image',
        function (err, rows) {

            if (err) {

                console.log(
                    'GET OLD DEV SUPPORT IMAGE ERROR:',
                    err
                );

                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            if (!rows || !rows.length) {

                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(req.file.filename)
                    );
                }

                return res.json({
                    status: 202,
                    message: 'Ticket not found'
                });
            }

            var oldImage = rows[0].image;

            var image = req.file
                ? getUploadedImagePath(req.file.filename)
                : oldImage;

            var QRY =
                "UPDATE dev_support_tickets SET " +
                "subject = ?, " +
                "description = ?, " +
                "application = ?, " +
                "ticket_type = ?, " +
                "priority = ?, " +
                "image = ? " +
                "WHERE id = ? " +
                "AND tenant_id = ? " +
                "AND d_in = 0";

            var params = [
                b.issue_title || b.subject || '',
                b.issue_description || b.description || '',
                b.application || null,
                b.ticket_type || 1,
                b.priority || 'medium',
                image,
                b.id,
                tenant_id
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'updatedevsupport',
                function (updateErr, result) {

                    if (updateErr) {

                        console.log(
                            'UPDATE DEV SUPPORT ERROR:',
                            updateErr
                        );

                        if (req.file) {
                            deleteUploadedFile(
                                getUploadedImagePath(
                                    req.file.filename
                                )
                            );
                        }

                        return res.json({
                            status: 500,
                            message: 'Internal server error',
                            error: updateErr.message
                        });
                    }

                    if (!result || !result.affectedRows) {

                        if (req.file) {
                            deleteUploadedFile(
                                getUploadedImagePath(
                                    req.file.filename
                                )
                            );
                        }

                        return res.json({
                            status: 202,
                            message: 'Ticket not found'
                        });
                    }

                    // Delete old image only after successful DB update
                    if (
                        req.file &&
                        oldImage &&
                        oldImage !== image
                    ) {
                        deleteUploadedFile(oldImage);
                    }

                    return res.json({
                        status: 200,
                        message: 'Ticket updated successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};
// POST /deletedevsupport
exports.deletedevsupport = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Ticket ID is required'
        });
    }

    var getImageQRY =
        "SELECT image " +
        "FROM dev_support_tickets " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND d_in = 0";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getImageQRY,
        [b.id, tenant_id],
        'deletedevsupport-get-image',
        function (err, rows) {

            if (err) {

                console.log(
                    'GET DEV SUPPORT IMAGE ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            if (!rows || !rows.length) {

                return res.json({
                    status: 202,
                    message: 'Ticket not found'
                });
            }

            var oldImage = rows[0].image;

            var deleteQRY =
                "UPDATE dev_support_tickets SET " +
                "d_in = 1 " +
                "WHERE id = ? " +
                "AND tenant_id = ? " +
                "AND d_in = 0";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                deleteQRY,
                [b.id, tenant_id],
                'deletedevsupport',
                function (deleteErr, result) {

                    if (deleteErr) {

                        console.log(
                            'DELETE DEV SUPPORT ERROR:',
                            deleteErr
                        );

                        return res.json({
                            status: 500,
                            message: 'Internal server error',
                            error: deleteErr.message
                        });
                    }

                    if (!result || !result.affectedRows) {

                        return res.json({
                            status: 202,
                            message: 'Ticket not found'
                        });
                    }

                    // Delete physical image only after DB update succeeds
                    if (oldImage) {
                        deleteUploadedFile(oldImage);
                    }

                    return res.json({
                        status: 200,
                        message: 'Ticket deleted successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};
// POST /adddevsupport
exports.adddevsupport = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    var image =
        req.file
            ? getUploadedImagePath(req.file.filename)
            : null;

    var QRY =
        "INSERT INTO dev_support_tickets " +
        "(tenant_id, raised_by, raised_by_type, subject, description, " +
        "application, ticket_type, dev_status, admin_status, remarks, " +
        "image, priority, status, i_ts) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, 0, NOW())";

    var params = [
        tenant_id,
        b.entry_by || req.admin.id,
        b.raised_by_type || 'admin',
        b.issue_title || b.subject || '',
        b.issue_description || b.description || '',
        b.application || null,
        b.ticket_type || 1,
        image,
        b.priority || 'medium'
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'adddevsupport',
        function (err, result) {

            if (err) {

                console.error(
                    'adddevsupport error:',
                    err
                );

                if (req.file) {
                    deleteUploadedFile(
                        getUploadedImagePath(
                            req.file.filename
                        )
                    );
                }

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            return res.json({
                status: 200,
                message: 'Ticket created successfully',
                insertId: result.insertId
            });
        }
    );
};
// POST /updatedevstatus
exports.updatedevstatus = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET dev_status = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id], 'updatedevstatus', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Dev status updated' });
    });
};

// POST /updateadminstatus
exports.updateadminstatus = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET admin_status = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id], 'updateadminstatus', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Admin status updated' });
    });
};

// POST /updatetickettype
exports.updatetickettype = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET ticket_type = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.value, req.body.id], 'updatetickettype', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Ticket type updated' });
    });
};

// POST /updateticketremarks
exports.updateticketremarks = function (req, res) {
    var QRY = 'UPDATE dev_support_tickets SET remarks = ? WHERE id = ?';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.remarks, req.body.id], 'updateticketremarks', function (err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Remarks updated' });
    });
};

// =============================================
// TENANT SETTINGS
// =============================================
// GET /getwebsitebanners
exports.getwebsitebanners = function (req, res) {

    var tenant_id = req.admin.tenant_id;

    var qry =
        "SELECT id, tenant_id, location, banner_image " +
        "FROM tenant_website_banners " +
        "WHERE tenant_id = ? " +
        "AND IFNULL(d_in,0) = 0 " +
        "ORDER BY id DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        qry,
        [tenant_id],
        'getwebsitebanners',
        function (err, rows) {

            if (err) {
                console.log('Get website banners error:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });
        }
    );
};


// POST /savewebsitebanner
exports.savewebsitebanner = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    var qry =
        "INSERT INTO tenant_website_banners " +
        "(tenant_id, location, banner_image) " +
        "VALUES (?, ?, ?)";

    var params = [
        tenant_id,
        b.location || '',
        b.banner_image || ''
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        qry,
        params,
        'savewebsitebanner',
        function (err, result) {

            if (err) {
                console.log('Save website banner error:', err);

                return res.json({
                    status: 500,
                    message: 'Failed to save banner'
                });
            }

            return res.json({
                status: 200,
                message: 'Banner saved successfully',
                id: result && result.insertId
                    ? result.insertId
                    : null
            });
        }
    );
};


// PUT /updatewebsitebanner/:id
exports.updatewebsitebanner = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Banner ID is required'
        });
    }

    var QRY =
        "UPDATE tenant_website_banners SET " +
        "location = ?, " +
        "banner_image = ? " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND IFNULL(d_in, 0) = 0";

    var params = [
        b.location || '',
        b.banner_image || '',
        id,
        tenant_id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'updatewebsitebanner',
        function (err, result) {

            if (err) {
                console.log(
                    'UPDATE WEBSITE BANNER ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!result || !result.affectedRows) {
                return res.json({
                    status: 202,
                    message: 'Banner not found'
                });
            }

            return res.json({
                status: 200,
                message: 'Banner updated successfully'
            });
        }
    );
};


// DELETE /deletewebsitebanner/:id
exports.deletewebsitebanner = function (req, res) {

    var id = req.params.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Banner ID is required'
        });
    }

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        'DELETE FROM tenant_website_banners WHERE id = ? AND tenant_id = ?',
        [id, req.admin.tenant_id],
        'deletewebsitebanner',
        function (err, result) {

            if (err) {
                console.log('DELETEWEBSITEBANNER ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!result || !result.affectedRows) {
                return res.json({
                    status: 202,
                    message: 'Banner not found'
                });
            }

            return res.json({
                status: 200,
                message: 'Banner deleted successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};
// GET /gettenantsettings
exports.gettenantsettings = function (req, res) {
    var tenant_id = req.admin.tenant_id;

var settingsQry =
    "SELECT ts.*, t.tenant_name, t.tenant_unique_code, t.business_address, " +
    "t.owner_name, t.owner_mobile_number, t.logo_image, t.favicon_image " +
    "FROM tenant_settings ts " +
    "INNER JOIN tenants t ON t.id = ts.tenant_id " +
    "WHERE ts.tenant_id = ? AND IFNULL(t.d_in,0) = 0";

    dbutil.sqlinjection(sqldb.MySQLConPool, settingsQry, [tenant_id], 'gettenantsettings-settings', function (err, settingsRows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });

var brandQry =
    "SELECT tb.*, " +
    "twbs.website_title, " +
    "twbs.tagline " +
    "FROM tenant_branding tb " +
    "LEFT JOIN tenant_website_brand_settings twbs " +
    "ON twbs.tenant_id = tb.tenant_id " +
    "AND IFNULL(twbs.d_in,0) = 0 " +
    "WHERE tb.tenant_id = ? " +
    "AND IFNULL(tb.d_in,0) = 0";
            dbutil.sqlinjection(sqldb.MySQLConPool, brandQry, [tenant_id], 'gettenantsettings-branding', function (err2, brandRows) {
            if (err2) return res.json({ status: 500, message: 'Internal server error' });

            return res.json({
                status: 200,
                data: {
                    settings: settingsRows && settingsRows.length > 0 ? settingsRows[0] : {},
                    branding: brandRows && brandRows.length > 0 ? brandRows[0] : {}
                }
            });
        });
    });
};

// POST /updatetenantsettings
// POST /updatetenantsettings
exports.updatetenantsettings = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    // Update tenant_settings
    if (b.settings) {

        var s = b.settings;

        var settingsQry =
            "UPDATE tenant_settings SET " +
            "currency_code = ?, " +
            "currency_symbol = ?, " +
            "timezone = ?, " +
            "primary_color = ?, " +
            "secondary_color = ?, " +
            "default_language = ?, " +
            "support_email = ?, " +
            "support_phone = ? " +
            "WHERE tenant_id = ?";

        var settingsParams = [
            s.currency_code || 'INR',
            s.currency_symbol || '',
            s.timezone || 'Asia/Kolkata',
            s.primary_color || '#01003c',
            s.secondary_color || '#6c757d',
            s.default_language || 'en',
            s.support_email || '',
            s.support_phone || '',
            tenant_id
        ];

        dbutil.sqlinjection(
            sqldb.MySQLConPool,
            settingsQry,
            settingsParams,
            'updatetenantsettings-settings',
            function (err) {

                if (err) {
                    console.log('Tenant settings update error:', err);
                }
            }
        );


        // Update tenant master data
      var tenantQry =
    "UPDATE tenants SET " +
    "tenant_name = ?, " +
    "tenant_unique_code = ?, " +
    "business_address = ? " +
    "WHERE id = ?";

var tenantParams = [
    s.tenant_name || '',
    s.tenant_unique_code || '',
    s.business_address || '',
    tenant_id
];

        dbutil.sqlinjection(
            sqldb.MySQLConPool,
            tenantQry,
            tenantParams,
            'updatetenantsettings-tenant',
            function (err) {

                if (err) {
                    console.log('Tenant master update error:', err);
                }
            }
        );
    }
if (b.branding) {
    var br = b.branding;

    var websiteBrandQry =
        "INSERT INTO tenant_website_brand_settings " +
        "(tenant_id, website_title, tagline) " +
        "VALUES (?, ?, ?) " +
        "ON DUPLICATE KEY UPDATE " +
        "website_title = VALUES(website_title), " +
        "tagline = VALUES(tagline)";

    var websiteBrandParams = [
        tenant_id,
        br.website_title || '',
        br.tagline || ''
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        websiteBrandQry,
        websiteBrandParams,
        'updatetenantsettings-website-brand',
        function (err) {
            if (err) {
                console.log('Website brand settings update error:', err);
            }
        }
    );
}

    // Update the business name on the tenant record itself
    if (b.settings && b.settings.tenant_name) {
        var nameQry = "UPDATE tenants SET tenant_name = ? WHERE id = ? AND IFNULL(d_in,0) = 0";
        dbutil.sqlinjection(sqldb.MySQLConPool, nameQry, [String(b.settings.tenant_name).trim().slice(0, 255), tenant_id], 'updatetenantsettings-name', function () { });
    }

    // Update tenant_branding
    if (b.branding) {

        var br = b.branding;
        var brandParams = [
            br.logo_light || null, br.logo_dark || null, br.logo_icon || null, br.login_bg_image || null, br.favicon || null,
            br.primary_color || '#01003c', br.secondary_color || '#6c757d', br.sidebar_color || '#01003c',
            br.header_color || null, br.button_color || null,
            br.font_family || null, br.custom_css || null
        ];

        // Super Admin seeds a branding row per tenant, but upsert so a tenant
        // created before that backfill can still save its branding.
        var existsQry = "SELECT MIN(id) AS id FROM tenant_branding WHERE tenant_id = ? AND IFNULL(d_in,0) = 0";
        dbutil.sqlinjection(sqldb.MySQLConPool, existsQry, [tenant_id], 'updatetenantsettings-brand-exists', function (bErr, bRows) {
            if (bErr) return;
            if (bRows && bRows[0] && bRows[0].id) {
                var brandQry = "UPDATE tenant_branding SET logo_light = ?, logo_dark = ?, logo_icon = ?, login_bg_image = ?, favicon = ?, " +
                    "primary_color = ?, secondary_color = ?, sidebar_color = ?, header_color = ?, button_color = ?, " +
                    "font_family = ?, custom_css = ? WHERE id = ?";
                dbutil.sqlinjection(sqldb.MySQLConPool, brandQry, brandParams.concat([bRows[0].id]), 'updatetenantsettings-branding', function () { });
            } else {
                var insQry = "INSERT INTO tenant_branding (tenant_id, brand_scope, logo_light, logo_dark, logo_icon, login_bg_image, favicon, " +
                    "primary_color, secondary_color, sidebar_color, header_color, button_color, font_family, custom_css, i_ts) " +
                    "VALUES (?, 'admin_dashboard', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
                dbutil.sqlinjection(sqldb.MySQLConPool, insQry, [tenant_id].concat(brandParams), 'updatetenantsettings-branding-ins', function () { });
            }
        });

        // Keep the copies Super Admin reads on its tenant list in step
        var mirrorQry = "UPDATE tenants SET logo_image = COALESCE(?, logo_image), favicon_image = COALESCE(?, favicon_image) WHERE id = ?";
        dbutil.sqlinjection(sqldb.MySQLConPool, mirrorQry, [br.logo_light || null, br.favicon || null, tenant_id], 'updatetenantsettings-mirror', function () { });
    }

    return res.json({
        status: 200,
        message: 'Settings updated successfully'
    });
};

// Products
async function saveAdminProduct(req, res, editing) {
    var b = req.body;
    var price = Number(b.base_price);
    var discount = b.discount_price == null || b.discount_price === '' ? null : Number(b.discount_price);
    var stock = b.stock_quantity == null || b.stock_quantity === '' ? 0 : Number(b.stock_quantity);
    if (b.base_price == null || String(b.base_price).trim() === '' || !Number.isFinite(price) || price < 0 ||
        (discount !== null && (!Number.isFinite(discount) || discount < 0 || discount > price)) ||
        !Number.isInteger(stock) || stock < 0) {
        return res.json({ status: 202, message: 'Enter valid non-negative prices and stock; discount price cannot exceed base price' });
    }
    var connection;
    try {
        connection = await new Promise(function(resolve, reject) {
            sqldb.MySQLConPool.getConnection(function(err, value) { if (err) reject(err); else resolve(value); });
        });
        var query = function(sql, params) {
            return new Promise(function(resolve, reject) {
                connection.query(sql, params || [], function(err, rows) { if (err) reject(err); else resolve(rows); });
            });
        };
        await query('START TRANSACTION');
        var owned = await query(editing
            ? 'SELECT p.id FROM products p JOIN vendors v ON v.id=p.vendor_id WHERE p.id=? AND v.tenant_id=? AND v.d_in=0 AND p.d_in=0 FOR UPDATE'
            : 'SELECT id FROM vendors WHERE id=? AND tenant_id=? AND d_in=0',
            [editing ? b.id : b.vendor_id, req.admin.tenant_id]);
        var category = await query('SELECT id FROM categories WHERE id=? AND tenant_id=? AND d_in=0', [b.category_id, req.admin.tenant_id]);
        if (!owned.length || !category.length) {
            await query('ROLLBACK');
            return res.json({ status: 202, message: 'Select a valid restaurant and category' });
        }
        var params = [b.category_id, b.product_name, b.product_code || null, b.description || null, price, discount, stock, b.is_veg || 0, b.is_returnable || 0, b.is_featured || 0];
        var productId;
        if (editing) {
            productId = b.id;
            await query('UPDATE products SET category_id=?, product_name=?, product_code=?, description=?, base_price=?, discount_price=?, stock_quantity=?, is_veg=?, is_returnable=?, is_featured=? WHERE id=?', params.concat([productId]));
        } else {
            var result = await query('INSERT INTO products (vendor_id, category_id, product_name, product_code, description, base_price, discount_price, stock_quantity, is_veg, is_returnable, is_featured, active_status, i_ts) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,NOW())', [b.vendor_id].concat(params));
            productId = result.insertId;
        }
        var variants = await query('SELECT id,is_default FROM product_variants WHERE product_id=? AND d_in=0', [productId]);
        if (!variants.length) {
            // Match the existing simple-item convention used by the catalogue seed.
            var units = await query("SELECT id FROM measurement_units WHERE unit_name='piece' AND is_active=1 ORDER BY id LIMIT 1");
            if (!units.length) throw new Error('An active piece measurement unit is required');
            await query("INSERT INTO product_variants (product_id,measurement_unit_id,variant_name,price,discount_price,stock_quantity,is_default,is_active,d_in) VALUES (?,?,'Regular',?,?,?,1,1,0)", [productId, units[0].id, price, discount, stock]);
        } else {
            // Keep other sizes/options and all existing availability flags unchanged.
            await query('UPDATE product_variants SET price=?,discount_price=?,stock_quantity=? WHERE product_id=? AND is_default=1 AND d_in=0', [price, discount, stock, productId]);
        }
        await query('COMMIT');
        return res.json(editing ? { status: 200, message: 'Product updated' } : { status: 200, message: 'Product added', insertId: productId });
    } catch (err) {
        if (connection) await new Promise(function(resolve) { connection.rollback(resolve); });
        console.error('ADMIN PRODUCT SAVE ERROR:', err.message);
        return res.json({ status: 500, message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
}

exports.addproduct = function(req, res) {
    return saveAdminProduct(req, res, false);
};

exports.getproducts = function(req, res) {
    var tenant_id = req.admin.tenant_id;
    var QRY = "SELECT p.*, c.category_name, v.vendor_name FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN vendors v ON v.id=p.vendor_id WHERE v.tenant_id=? AND p.d_in=0 ORDER BY p.i_ts DESC";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenant_id], 'getproducts', function(err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

exports.updateproduct = function(req, res) {
    return saveAdminProduct(req, res, true);
};

exports.deleteproduct = function(req, res) {

    console.log('DELETE PRODUCT BODY:', req.body);

    var tenant_id = req.admin.tenant_id;
    var ids = Array.isArray(req.body.id) ? req.body.id : [req.body.id];

    if (!ids.length || !ids[0]) {
        return res.json({
            status: 400,
            message: 'Product ID is required'
        });
    }

    var placeholders = ids.map(function() {
        return '?';
    }).join(',');

    var qry = 'DELETE FROM products WHERE id IN (' + placeholders + ') ' +
        'AND vendor_id IN (SELECT id FROM vendors WHERE tenant_id = ?)';

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        qry,
        ids.concat([tenant_id]),
        'deleteproduct',
        function(err) {

            console.log('DELETE PRODUCT ERROR:', err);

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Product deleted'
            });

        }
    );
};
exports.updateproductactivestatus = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'UPDATE products SET active_status=? WHERE id=?', [req.body.active_status, req.body.id], 'updateproductactivestatus', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Status updated' });
    });
};

// Delivery Partners
// Delivery Partners
exports.adddeliverypartner = function(req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;
    if (rejectInvalidIdentity(req, res, { editing: false })) return;

    var aadhar_image =
        req.files &&
        req.files.aadhar_image &&
        req.files.aadhar_image[0]
            ? getUploadedImagePath(req.files.aadhar_image[0].filename)
            : null;

    var pan_image =
        req.files &&
        req.files.pan_image &&
        req.files.pan_image[0]
            ? getUploadedImagePath(req.files.pan_image[0].filename)
            : null;

    var bank_details_image =
        req.files &&
        req.files.bank_details_image &&
        req.files.bank_details_image[0]
            ? getUploadedImagePath(req.files.bank_details_image[0].filename)
            : null;

    var driving_license_image =
        req.files &&
        req.files.driving_license_image &&
        req.files.driving_license_image[0]
            ? getUploadedImagePath(req.files.driving_license_image[0].filename)
            : null;

    var checkQry =
        'SELECT id FROM delivery_partners WHERE mobile_number=? AND tenant_id=? AND d_in=0';

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        checkQry,
        [b.mobile_number, tenant_id],
        'adddeliverypartner-check',
        function(err, rows) {

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (rows && rows.length) {
                return res.json({
                    status: 300,
                    message: 'Mobile number already exists'
                });
            }

            var QRY =
                "INSERT INTO delivery_partners (" +
                "tenant_id, name, mobile_number, pwd, address, location_id, cod_limit, " +
                "aadhar_number, aadhar_image, driving_license_number, driving_license_image, " +
                "pan_number, pan_image, vehicle_type, vehicle_number, bank_account_number, " +
                "bank_ifsc_code, bank_details_image, active_status, i_ts" +
                ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW())";

            var params = [
                tenant_id,
                b.name,
                b.mobile_number,
                b.pwd,
                b.address || null,
                b.location_id || null,
                b.cod_limit || 0,
                b.aadhar_number || null,
                aadhar_image,
                b.driving_license_number || null,
                driving_license_image,
                b.pan_number || null,
                pan_image,
                b.vehicle_type || null,
                b.vehicle_number || null,
                b.bank_account_number || null,
                b.bank_ifsc_code || null,
                bank_details_image
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'adddeliverypartner',
                function(err2, result) {

                    if (err2) {
                        console.log('ADD DELIVERY PARTNER ERROR:', err2.code);

                        deleteUploadedFile(aadhar_image);
                        deleteUploadedFile(pan_image);
                        deleteUploadedFile(bank_details_image);
                        deleteUploadedFile(driving_license_image);

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    return res.json({
                        status: 200,
                        message: 'Delivery partner added',
                        insertId: result.insertId
                    });
                }
            );
        }
    );
};


exports.updatedeliverypartner = function(req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Delivery partner ID is required'
        });
    }

    var getQry =
        "SELECT aadhar_image, pan_image, bank_details_image, driving_license_image " +
        "FROM delivery_partners " +
        "WHERE id=? AND tenant_id=?";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getQry,
        [b.id, tenant_id],
        'updatedeliverypartner-get',
        function(err, rows) {

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                return res.json({
                    status: 202,
                    message: 'Delivery partner not found'
                });
            }

            var existing = rows[0];
            if (rejectInvalidIdentity(req, res, { editing: true, saved: existing })) return;

            var newAadharFile =
                req.files &&
                req.files.aadhar_image &&
                req.files.aadhar_image[0]
                    ? req.files.aadhar_image[0]
                    : null;

            var newPanFile =
                req.files &&
                req.files.pan_image &&
                req.files.pan_image[0]
                    ? req.files.pan_image[0]
                    : null;

            var newBankFile =
                req.files &&
                req.files.bank_details_image &&
                req.files.bank_details_image[0]
                    ? req.files.bank_details_image[0]
                    : null;

            var newDrivingFile =
                req.files &&
                req.files.driving_license_image &&
                req.files.driving_license_image[0]
                    ? req.files.driving_license_image[0]
                    : null;

            var aadhar_image = newAadharFile
                ? getUploadedImagePath(newAadharFile.filename)
                : existing.aadhar_image;

            var pan_image = newPanFile
                ? getUploadedImagePath(newPanFile.filename)
                : existing.pan_image;

            var bank_details_image = newBankFile
                ? getUploadedImagePath(newBankFile.filename)
                : existing.bank_details_image;

            var driving_license_image = newDrivingFile
                ? getUploadedImagePath(newDrivingFile.filename)
                : existing.driving_license_image;

            var QRY =
                "UPDATE delivery_partners SET " +
                "name=?, mobile_number=?, address=?, location_id=?, cod_limit=?, " +
                "aadhar_number=?, aadhar_image=?, driving_license_number=?, driving_license_image=?, " +
                "pan_number=?, pan_image=?, bank_account_number=?, bank_ifsc_code=?, bank_details_image=? " +
                "WHERE id=? AND tenant_id=?";

            var params = [
                b.name,
                b.mobile_number,
                b.address || null,
                b.location_id || null,
                b.cod_limit || 0,
                b.aadhar_number || null,
                aadhar_image,
                b.driving_license_number || null,
                driving_license_image,
                b.pan_number || null,
                pan_image,
                b.bank_account_number || null,
                b.bank_ifsc_code || null,
                bank_details_image,
                b.id,
                tenant_id
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'updatedeliverypartner',
                function(err2, result) {

                    if (err2) {
                        console.log('UPDATE DELIVERY PARTNER ERROR:', err2.code);

                        if (newAadharFile) deleteUploadedFile(aadhar_image);
                        if (newPanFile) deleteUploadedFile(pan_image);
                        if (newBankFile) deleteUploadedFile(bank_details_image);
                        if (newDrivingFile) deleteUploadedFile(driving_license_image);

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {
                        if (newAadharFile) deleteUploadedFile(aadhar_image);
                        if (newPanFile) deleteUploadedFile(pan_image);
                        if (newBankFile) deleteUploadedFile(bank_details_image);
                        if (newDrivingFile) deleteUploadedFile(driving_license_image);

                        return res.json({
                            status: 202,
                            message: 'Delivery partner not found'
                        });
                    }

                    // Delete replaced old files only after DB update succeeds.
                    if (newAadharFile &&
                        existing.aadhar_image &&
                        existing.aadhar_image !== aadhar_image) {
                        deleteUploadedFile(existing.aadhar_image);
                    }

                    if (newPanFile &&
                        existing.pan_image &&
                        existing.pan_image !== pan_image) {
                        deleteUploadedFile(existing.pan_image);
                    }

                    if (newBankFile &&
                        existing.bank_details_image &&
                        existing.bank_details_image !== bank_details_image) {
                        deleteUploadedFile(existing.bank_details_image);
                    }

                    if (newDrivingFile &&
                        existing.driving_license_image &&
                        existing.driving_license_image !== driving_license_image) {
                        deleteUploadedFile(existing.driving_license_image);
                    }

                    return res.json({
                        status: 200,
                        message: 'Delivery partner updated'
                    });
                }
            );
        }
    );
};
exports.getdeliverypartners = function(req, res) {
    var QRY =
        "SELECT " +
        "dp.id, " +
        "dp.name, " +
        "dp.mobile_number, " +
        "dp.pwd, " +
        "dp.address, " +
        "dp.location_id, " +
        "l.city AS location_name, " +
        "dp.cod_limit, " +
        "dp.aadhar_number, " +
        "dp.aadhar_image, " +
        "dp.pan_number, " +
        "dp.pan_image, " +
        "dp.bank_account_number, " +
        "dp.bank_ifsc_code, " +
        "dp.bank_details_image, " +
        "dp.driving_license_number, " +
        "dp.driving_license_image, " +
        "dp.login_status, " +
        "dp.active_status " +
        "FROM delivery_partners dp " +
        "LEFT JOIN locations l ON l.id=dp.location_id " +
        "WHERE dp.tenant_id=? " +
        "AND dp.d_in=0 " +
        "ORDER BY dp.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [req.admin.tenant_id],
        'getdeliverypartners',
        function(err, rows) {
            if (err) {
                console.log('GET DELIVERY PARTNERS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });
        }
    );
};
// Hard delete, refused while assignments or settlements still reference the partner.
exports.deletedeliverypartner = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Delivery partner ID is required'
        });
    }

    var CHECK_QRY =
        "SELECT " +
        "(SELECT COUNT(*) FROM delivery_partners WHERE id = ? AND tenant_id = ?) AS found, " +
        "(SELECT COUNT(*) FROM delivery_assignments WHERE delivery_partner_id = ? AND IFNULL(d_in,0) = 0) AS assignments, " +
        "(SELECT COUNT(*) FROM delivery_partner_settlements WHERE delivery_partner_id = ? AND IFNULL(d_in,0) = 0) AS settlements";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        CHECK_QRY,
        [id, tenant_id, id, id],
        'deletedeliverypartner-check',
        function (err, rows) {

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            var r = rows && rows[0];

            if (!r || !r.found) {
                return res.json({
                    status: 202,
                    message: 'Delivery partner not found'
                });
            }

            var usage = [];

            if (r.assignments) {
                usage.push(r.assignments + ' delivery assignment(s)');
            }

            if (r.settlements) {
                usage.push(r.settlements + ' settlement(s)');
            }

            if (usage.length) {
                return res.json({
                    status: 202,
                    message: 'Cannot delete: this delivery partner has ' + usage.join(', ')
                });
            }

            // Get image paths before deleting the database record.
            var IMAGE_QRY =
                "SELECT aadhar_image, pan_image, bank_details_image, driving_license_image " +
                "FROM delivery_partners " +
                "WHERE id = ? AND tenant_id = ?";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                IMAGE_QRY,
                [id, tenant_id],
                'deletedeliverypartner-images',
                function (imageErr, imageRows) {

                    if (imageErr) {
                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    var images = imageRows && imageRows[0];

                    var DELETE_QRY =
                        "DELETE FROM delivery_partners " +
                        "WHERE id = ? AND tenant_id = ?";

                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        DELETE_QRY,
                        [id, tenant_id],
                        'deletedeliverypartner',
                        function (err2, result) {

                            if (err2) {
                                return res.json({
                                    status: 500,
                                    message: 'Internal server error'
                                });
                            }

                            if (!result || !result.affectedRows) {
                                return res.json({
                                    status: 202,
                                    message: 'Delivery partner not found'
                                });
                            }

                            // Delete all associated physical image files.
                            if (images) {
                                deleteUploadedFile(images.aadhar_image);
                                deleteUploadedFile(images.pan_image);
                                deleteUploadedFile(images.bank_details_image);
                                deleteUploadedFile(images.driving_license_image);
                            }

                            return res.json({
                                status: 200,
                                message: 'Delivery partner deleted successfully',
                                affectedRows: result.affectedRows
                            });
                        }
                    );
                }
            );
        }
    );
};
exports.updatedeliverypartneractivestatus = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'UPDATE delivery_partners SET active_status=? WHERE id=? AND tenant_id=?', [req.body.value != undefined ? req.body.value : req.body.active_status, req.body.id, req.admin.tenant_id], 'updatedeliverypartneractivestatus', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Status updated' });
    });
};

exports.updatedeliverypartnerloginstatus = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'UPDATE delivery_partners SET login_status=? WHERE id=? AND tenant_id=?', [req.body.value != undefined ? req.body.value : req.body.login_status, req.body.id, req.admin.tenant_id], 'updatedeliverypartnerloginstatus', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Status updated' });
    });
};

// Orders
exports.getorders = function(req, res) {
console.log('===== GETORDERS HIT =====');
    var tenant_id = req.admin.tenant_id;
    var b = req.body;
console.log('GET ORDERS FILTERS:', b);
console.log('GET ORDERS STATUS:', b.order_status, typeof b.order_status);
    var conditions = ['v.tenant_id=?', 'o.d_in=0'];
    var params = [tenant_id];

   if (b.from_date && b.to_date) {
    conditions.push('o.order_date_time >= ? AND o.order_date_time < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(b.from_date, b.to_date);
}

    if (b.vendor_id) {
        conditions.push('o.vendor_id=?');
        params.push(b.vendor_id);
    }
if (b.category_id) {
    conditions.push(`
        EXISTS (
            SELECT 1
            FROM order_items oi
            INNER JOIN product_variants pv
                ON pv.id = oi.product_variant_id
            INNER JOIN products p
                ON p.id = pv.product_id
            WHERE oi.order_id = o.id
              AND p.category_id = ?
        )
    `);

    params.push(b.category_id);
}

if (b.location_id) {
    conditions.push('v.location_id=?');
    params.push(b.location_id);
}
    if (b.order_status !== undefined && b.order_status !== '') {
        conditions.push('o.order_status=?');
        params.push(b.order_status);
    }

    var WHERE = conditions.join(' AND ');

    // Get total number of matching orders
    var COUNT_QRY =
        "SELECT COUNT(*) as total " +
        "FROM orders o " +
        "LEFT JOIN customers c ON c.id=o.customer_id " +
        "LEFT JOIN vendors v ON v.id=o.vendor_id " +
        "WHERE " + WHERE;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        COUNT_QRY,
        params,
        'getorders-count',
        function(err, countRows) {

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

           var QRY =
    "SELECT o.*, c.customer_name, " +
    "c.mobile_number as customer_mobile, " +
    "v.vendor_name, " +
    "ca.full_address AS delivery_address " +
    "FROM orders o " +
    "LEFT JOIN customers c ON c.id=o.customer_id " +
    "LEFT JOIN vendors v ON v.id=o.vendor_id " +
    "LEFT JOIN customer_addresses ca ON ca.id=o.customer_address_id " +
    "WHERE " + WHERE +
    " ORDER BY o.order_date_time DESC";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'getorders',
                function(err, rows) {

                    if (err) {
                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    return res.json({
                        status: 200,
                        data: rows,
                        total: countRows[0].total
                    });
                }
            );
        }
    );
};

exports.getorderdetails = function(req, res) {
    var QRY = "SELECT o.*, c.customer_name, c.mobile_number AS customer_mobile, v.vendor_name, " +
        "ca.full_address AS delivery_address, ca.landmark AS delivery_landmark, ca.pincode AS delivery_pincode " +
        "FROM orders o " +
        "LEFT JOIN vendors v ON v.id=o.vendor_id " +
        "LEFT JOIN customers c ON c.id=o.customer_id AND c.tenant_id=v.tenant_id " +
        "LEFT JOIN customer_addresses ca ON ca.id=o.customer_address_id AND ca.customer_id=c.id " +
        "WHERE o.id=? AND v.tenant_id=?";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.body.order_id, req.admin.tenant_id], 'getorderdetails-order', function(err, rows) {
        if (err || !rows || !rows.length) return res.json({ status: 500, message: 'Order not found' });
        var order = rows[0];
        var snapshot = order.address_snapshot;
        if (typeof snapshot === 'string') {
            try { snapshot = JSON.parse(snapshot); } catch (_) { snapshot = null; }
        }
        if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) snapshot = {};

        // Use the order-time address as a whole; never mix it with a later edited address.
        var snapshotAddress = [snapshot.line || snapshot.full_address, snapshot.landmark, snapshot.pincode];
        var savedAddress = [order.delivery_address, order.delivery_landmark, order.delivery_pincode];
        var addresses = [snapshotAddress, savedAddress].map(function(parts) {
            return parts.map(function(value) {
                return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
            }).filter(Boolean).join(', ');
        });
        order.delivery_address = addresses[0] || addresses[1] || null;
        delete order.delivery_landmark;
        delete order.delivery_pincode;

        dbutil.sqlinjection(sqldb.MySQLConPool, 'SELECT * FROM order_items WHERE order_id=? AND d_in=0', [req.body.order_id], 'getorderdetails-items', function(err2, items) {
            order.items = items || [];
            return res.json({ status: 200, data: order });
        });
    });
};

exports.updateorderstatus = function(req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;
    var allowedStatuses = [0, 1, 2, 3, 4, 5, 6];

    var orderId = Number(b.order_id);
    var newStatus = Number(b.new_status);

    if (!orderId || !allowedStatuses.includes(newStatus)) {
        return res.json({
            status: 202,
            message: 'Invalid order ID or order status'
        });
    }

    /*
     * Get current order.
     *
     * Orders does not contain tenant_id, so tenant ownership
     * is verified through the vendor.
     */
    var GET_QRY =
        'SELECT o.order_status, o.payment_type, o.grand_total ' +
        'FROM orders o ' +
        'INNER JOIN vendors v ON v.id=o.vendor_id ' +
        'WHERE o.id=? ' +
        'AND v.tenant_id=? ' +
        'AND IFNULL(o.d_in,0)=0 ' +
        'AND IFNULL(v.d_in,0)=0';

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        GET_QRY,
        [orderId, tenant_id],
        'updateorderstatus-get',
        function(err, rows) {

            if (err) {
                console.log('GET ORDER STATUS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                return res.json({
                    status: 202,
                    message: 'Order not found'
                });
            }

            var oldStatus = Number(rows[0].order_status);
            var paymentType = rows[0].payment_type;
            var grandTotal = Number(rows[0].grand_total || 0);

            /*
             * Do not create a duplicate history entry
             * when the same status is selected again.
             */
            if (oldStatus === newStatus) {
                return res.json({
                    status: 202,
                    message: 'Order already has this status'
                });
            }

            /*
             * Build timestamp update according to status.
             */
            var timestampField = '';

            if (newStatus === 1) {
                timestampField = ', accepted_at=NOW()';
            } else if (newStatus === 2) {
                timestampField = ', ready_at=NOW()';
            } else if (newStatus === 3) {
                timestampField = ', picked_up_at=NOW()';
            } else if (newStatus === 4) {
                timestampField = ', delivered_at=NOW()';
            } else if (newStatus === 5 || newStatus === 6) {
                timestampField = ', cancelled_at=NOW()';
            }

            var UPDATE_QRY =
                'UPDATE orders ' +
                'SET order_status=? ' +
                timestampField +
                ' WHERE id=? ' +
                'AND d_in=0';

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                UPDATE_QRY,
                [newStatus, orderId],
                'updateorderstatus-update',
                function(err2) {

                    if (err2) {
                        console.log('UPDATE ORDER STATUS ERROR:', err2);

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    /*
                     * Save status history.
                     */
                    var HISTORY_QRY =
                        'INSERT INTO order_status_history ' +
                        '(order_id, old_status, new_status, changed_by_type, changed_by_id, remarks, i_ts) ' +
                        'VALUES (?,?,?,?,?,?,NOW())';

                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        HISTORY_QRY,
                        [
                            orderId,
                            oldStatus,
                            newStatus,
                            'admin',
                            req.admin.id,
                            b.remarks || null
                        ],
                        'updateorderstatus-history',
                        function(err3) {

                            if (err3) {
                                console.log(
                                    'ORDER STATUS HISTORY ERROR:',
                                    err3
                                );

                                return res.json({
                                    status: 500,
                                    message: 'Order updated, but status history could not be saved'
                                });
                            }

                            /*
                             * COD SETTLEMENT
                             *
                             * Only process settlement when:
                             * - Order becomes Completed (4)
                             * - Payment type is COD
                             */
                            if (
                                newStatus !== 4 ||
                                String(paymentType || '').toLowerCase() !== 'cod'
                            ) {
                                return res.json({
                                    status: 200,
                                    message: 'Order status updated'
                                });
                            }

                            /*
                             * Find the actual completed delivery assignment.
                             *
                             * assignment_status = 3
                             * delivered_at IS NOT NULL
                             *
                             * This prevents using an old/pending assignment.
                             */
                            var assignmentQry =
                                'SELECT ' +
                                'da.id AS assignment_id, ' +
                                'da.delivery_partner_id, ' +
                                'da.base_pay, ' +
                                'da.distance_pay, ' +
                                'da.tip_pay, ' +
                                'da.delivered_at ' +
                                'FROM delivery_assignments da ' +
                                'INNER JOIN orders o ON o.id=da.order_id ' +
                                'INNER JOIN vendors v ON v.id=o.vendor_id ' +
                                'WHERE da.order_id=? ' +
                                'AND v.tenant_id=? ' +
                                'AND da.assignment_status=3 ' +
                                'AND da.delivered_at IS NOT NULL ' +
                                'AND IFNULL(da.d_in,0)=0 ' +
                                'AND IFNULL(v.d_in,0)=0 ' +
                                'ORDER BY da.delivered_at DESC, da.id DESC ' +
                                'LIMIT 1';

                            dbutil.sqlinjection(
                                sqldb.MySQLConPool,
                                assignmentQry,
                                [orderId, tenant_id],
                                'updateorderstatus-assignment',
                                function(err4, assignmentRows) {

                                    if (err4) {
                                        console.log(
                                            'GET COMPLETED DELIVERY ASSIGNMENT ERROR:',
                                            err4
                                        );

                                        return res.json({
                                            status: 500,
                                            message: 'Order status updated, but settlement could not be created'
                                        });
                                    }

                                    /*
                                     * If there is no completed delivery assignment,
                                     * the order can still be completed, but no
                                     * delivery-partner settlement is created.
                                     */
                                    if (
                                        !assignmentRows ||
                                        !assignmentRows.length
                                    ) {
                                        return res.json({
                                            status: 200,
                                            message: 'Order status updated'
                                        });
                                    }

                                    var assignment =
                                        assignmentRows[0];

                                    var assignmentId =
                                        Number(
                                            assignment.assignment_id
                                        );

                                    var deliveryPartnerId =
                                        Number(
                                            assignment.delivery_partner_id
                                        );

                                    /*
                                     * Delivery earning =
                                     * base pay + distance pay + tip pay
                                     */
                                    var deliveryEarnings =
                                        Number(
                                            assignment.base_pay || 0
                                        ) +
                                        Number(
                                            assignment.distance_pay || 0
                                        ) +
                                        Number(
                                            assignment.tip_pay || 0
                                        );

                                    /*
                                     * Use delivered_at to determine
                                     * the settlement week.
                                     *
                                     * Settlement week:
                                     * Saturday -> Friday
                                     *
                                     * JavaScript:
                                     * Sunday    = 0
                                     * Monday    = 1
                                     * Tuesday   = 2
                                     * Wednesday = 3
                                     * Thursday  = 4
                                     * Friday    = 5
                                     * Saturday  = 6
                                     */
                                    var deliveredDate =
                                        new Date(
                                            assignment.delivered_at
                                        );

                                    var deliveredDay =
                                        deliveredDate.getDay();

                                    /*
                                     * Number of days to move backwards
                                     * from delivered date to Saturday.
                                     */
                                    var daysFromSaturday =
                                        (deliveredDay + 1) % 7;

                                    var settlementStart =
                                        new Date(
                                            deliveredDate
                                        );

                                    settlementStart.setHours(
                                        0,
                                        0,
                                        0,
                                        0
                                    );

                                    settlementStart.setDate(
                                        settlementStart.getDate() -
                                        daysFromSaturday
                                    );

                                    var settlementEnd =
                                        new Date(
                                            settlementStart
                                        );

                                    settlementEnd.setDate(
                                        settlementEnd.getDate() + 6
                                    );

                                    function formatSettlementDate(date) {
                                        var year =
                                            date.getFullYear();

                                        var month =
                                            String(
                                                date.getMonth() + 1
                                            ).padStart(2, '0');

                                        var day =
                                            String(
                                                date.getDate()
                                            ).padStart(2, '0');

                                        return (
                                            year +
                                            '-' +
                                            month +
                                            '-' +
                                            day
                                        );
                                    }

                                    var periodStart =
                                        formatSettlementDate(
                                            settlementStart
                                        );

                                    var periodEnd =
                                        formatSettlementDate(
                                            settlementEnd
                                        );

                                    /*
                                     * Find the current pending weekly settlement.
                                     *
                                     * IMPORTANT:
                                     * settlement_status = 0 means pending.
                                     *
                                     * Existing paid settlements
                                     * (settlement_status = 1)
                                     * will NOT be modified.
                                     */
                                    var weeklySettlementQry =
                                        'SELECT ' +
                                        'id, ' +
                                        'total_orders, ' +
                                        'cod_amount_collected, ' +
                                        'delivery_earnings, ' +
                                        'advance_deducted ' +
                                        'FROM delivery_partner_settlements ' +
                                        'WHERE delivery_partner_id=? ' +
                                        'AND settlement_period_start=? ' +
                                        'AND settlement_period_end=? ' +
                                        'AND settlement_status=0 ' +
                                        'AND IFNULL(d_in,0)=0 ' +
                                        'ORDER BY id DESC ' +
                                        'LIMIT 1';

                                    dbutil.sqlinjection(
                                        sqldb.MySQLConPool,
                                        weeklySettlementQry,
                                        [
                                            deliveryPartnerId,
                                            periodStart,
                                            periodEnd
                                        ],
                                        'updateorderstatus-weekly-settlement-check',
                                        function(
                                            err5,
                                            weeklyRows
                                        ) {

                                            if (err5) {
                                                console.log(
                                                    'CHECK WEEKLY COD SETTLEMENT ERROR:',
                                                    err5
                                                );

                                                return res.json({
                                                    status: 500,
                                                    message: 'Order status updated, but settlement could not be created'
                                                });
                                            }

                                            /*
                                             * Existing pending weekly
                                             * settlement found.
                                             *
                                             * Add this order's values.
                                             */
                                            if (
                                                weeklyRows &&
                                                weeklyRows.length
                                            ) {

                                                var weeklySettlement =
                                                    weeklyRows[0];

                                                var settlementId =
                                                    Number(
                                                        weeklySettlement.id
                                                    );

                                                var totalOrders =
                                                    Number(
                                                        weeklySettlement.total_orders || 0
                                                    ) + 1;

                                                var codAmountCollected =
                                                    Number(
                                                        weeklySettlement.cod_amount_collected || 0
                                                    ) +
                                                    grandTotal;

                                                var totalDeliveryEarnings =
                                                    Number(
                                                        weeklySettlement.delivery_earnings || 0
                                                    ) +
                                                    deliveryEarnings;

                                                var advanceDeducted =
                                                    Number(
                                                        weeklySettlement.advance_deducted || 0
                                                    );

                                                var netPayable =
                                                    totalDeliveryEarnings -
                                                    advanceDeducted;

                                                /*
                                                 * Update only the pending
                                                 * settlement.
                                                 */
                                                var updateSettlementQry =
                                                    'UPDATE delivery_partner_settlements ' +
                                                    'SET total_orders=?, ' +
                                                    'cod_amount_collected=?, ' +
                                                    'delivery_earnings=?, ' +
                                                    'net_payable=? ' +
                                                    'WHERE id=? ' +
                                                    'AND delivery_partner_id=? ' +
                                                    'AND settlement_status=0 ' +
                                                    'AND IFNULL(d_in,0)=0';

                                                var updateSettlementParams = [
                                                    totalOrders,
                                                    codAmountCollected,
                                                    totalDeliveryEarnings,
                                                    netPayable,
                                                    settlementId,
                                                    deliveryPartnerId
                                                ];

                                                dbutil.sqlinjection(
                                                    sqldb.MySQLConPool,
                                                    updateSettlementQry,
                                                    updateSettlementParams,
                                                    'updateorderstatus-update-weekly-settlement',
                                                    function(err6) {

                                                        if (err6) {
                                                            console.log(
                                                                'UPDATE WEEKLY COD SETTLEMENT ERROR:',
                                                                err6
                                                            );

                                                            return res.json({
                                                                status: 500,
                                                                message: 'Order status updated, but settlement could not be updated'
                                                            });
                                                        }

                                                        return res.json({
                                                            status: 200,
                                                            message: 'Order completed and COD settlement updated'
                                                        });
                                                    }
                                                );

                                                return;
                                            }

                                            /*
                                             * No pending settlement exists
                                             * for this partner and week.
                                             *
                                             * Create a new weekly settlement.
                                             */
                                            var advanceDeducted = 0;

                                            var netPayable =
                                                deliveryEarnings -
                                                advanceDeducted;

                                            var settlementQry =
                                                'INSERT INTO delivery_partner_settlements ' +
                                                '(delivery_partner_id, ' +
                                                'delivery_assignment_id, ' +
                                                'settlement_period_start, ' +
                                                'settlement_period_end, ' +
                                                'total_orders, ' +
                                                'cod_amount_collected, ' +
                                                'delivery_earnings, ' +
                                                'advance_deducted, ' +
                                                'net_payable, ' +
                                                'settlement_status, ' +
                                                'i_ts, ' +
                                                'd_in) ' +
                                                'VALUES (?,?,?,?,?,?,?,?,?,0,NOW(),0)';

                                            var settlementParams = [
                                                deliveryPartnerId,
                                                assignmentId,
                                                periodStart,
                                                periodEnd,
                                                1,
                                                grandTotal,
                                                deliveryEarnings,
                                                advanceDeducted,
                                                netPayable
                                            ];

                                            dbutil.sqlinjection(
                                                sqldb.MySQLConPool,
                                                settlementQry,
                                                settlementParams,
                                                'updateorderstatus-create-weekly-settlement',
                                                function(err7) {

                                                    if (err7) {
                                                        console.log(
                                                            'CREATE WEEKLY COD SETTLEMENT ERROR:',
                                                            err7
                                                        );

                                                        return res.json({
                                                            status: 500,
                                                            message: 'Order status updated, but settlement could not be created'
                                                        });
                                                    }

                                                    return res.json({
                                                        status: 200,
                                                        message: 'Order completed and COD settlement created'
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

// =============================================
// DRIVER ACTIVITY
// =============================================
exports.getdriveractivity = function(req, res) {
    var tenant_id = req.admin.tenant_id;

    // Query joins delivery_assignments, orders, and delivery_partners
    var QRY = 
        "SELECT " +
        "da.id AS assignment_id, " +
        "da.order_id, " +
        "o.order_number, " +
        "o.address_snapshot, " +
        "o.grand_total, " +
        "o.order_status, " +
        "dp.name AS delivery_partner_name, " +
        "dp.mobile_number AS delivery_partner_phone, " +
        "da.assigned_at, " +
        "da.picked_up_at " +
        "FROM delivery_assignments da " +
        "INNER JOIN orders o ON da.order_id = o.id " +
        "INNER JOIN delivery_partners dp ON da.delivery_partner_id = dp.id " +
        "INNER JOIN vendors v ON v.id = o.vendor_id " +
        "WHERE v.tenant_id = ? " +
        "AND IFNULL(da.d_in, 0) = 0 " +
        "AND IFNULL(o.d_in, 0) = 0 " +
        "ORDER BY da.assigned_at DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getdriveractivity',
        function(err, rows) {
            if (err) {
                console.log('GET DRIVER ACTIVITY ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });
        }
    );
};


// GET /getcategory
exports.getcategory = function (req, res) {
    var tenant_id = req.admin.tenant_id;

    var QRY = "SELECT * FROM categories " +
        "WHERE tenant_id = ? " +
        "AND parent_id IS NULL " +
        "AND IFNULL(d_in,0) = 0 " +
        "ORDER BY category_order, i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getcategory',
        function (err, rows) {
            if (err) {
                console.log('GET CATEGORY ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

          rows = rows.map(function (row) {
              if (row.category_image) {
                  row.category_image = getPublicImageUrl(row.category_image, req);
              }

              return row;
          });

return res.json({
    status: 200,
    data: rows
});
        }
    );
};
// GET /getmainfilter
exports.getmainfilter = function (req, res) {
    var tenant_id = req.admin.tenant_id;

    var QRY = "SELECT " +
        "cf.id, " +
        "cf.category_id, " +
        "cf.filter_name, " +
        "c.category_name " +
        "FROM catalog_filters cf " +
        "INNER JOIN categories c ON c.id = cf.category_id " +
        "WHERE c.tenant_id = ? " +
        "AND c.parent_id IS NULL " +
        "AND IFNULL(cf.d_in, 0) = 0 " +
        "ORDER BY cf.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getmainfilter',
        function (err, rows) {
            if (err) {
                console.log('GET MAIN FILTER ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows
            });
        }
    );
};
// POST /addmainfilter
exports.addmainfilter = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var category_id = req.body.category_id;
    var filter_name = req.body.filter_name;

    if (!category_id || !filter_name) {
        return res.json({
            status: 202,
            message: 'Category and Main Filter are required'
        });
    }

    // Make sure the selected category belongs to the logged-in tenant
    // and is a main category.
    var CHECK_QRY = "SELECT id FROM categories " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND parent_id IS NULL " +
        "AND IFNULL(d_in, 0) = 0";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        CHECK_QRY,
        [category_id, tenant_id],
        'addmainfilter-check-category',
        function (err, rows) {
            if (err) {
                console.log('ADD MAIN FILTER CATEGORY CHECK ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || rows.length === 0) {
                return res.json({
                    status: 202,
                    message: 'Invalid category'
                });
            }

            var QRY = "INSERT INTO catalog_filters " +
                "(category_id, filter_name, i_ts, d_in) " +
                "VALUES (?, ?, NOW(), 0)";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                [category_id, filter_name.trim()],
                'addmainfilter',
                function (err2, result) {
                    if (err2) {
                        console.log('ADD MAIN FILTER ERROR:', err2);
                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    return res.json({
                        status: 200,
                        message: 'Main filter added successfully',
                        id: result.insertId
                    });
                }
            );
        }
    );
};
// POST /updatemainfilter
exports.updatemainfilter = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;
    var category_id = req.body.category_id;
    var filter_name = req.body.filter_name;

    if (!id || !category_id || !filter_name) {
        return res.json({
            status: 202,
            message: 'ID, Category and Main Filter are required'
        });
    }

    // Make sure the selected category belongs to the logged-in tenant
    // and is a main category.
    var CHECK_QRY = "SELECT id FROM categories " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND parent_id IS NULL " +
        "AND IFNULL(d_in, 0) = 0";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        CHECK_QRY,
        [category_id, tenant_id],
        'updatemainfilter-check-category',
        function (err, rows) {
            if (err) {
                console.log('UPDATE MAIN FILTER CATEGORY CHECK ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || rows.length === 0) {
                return res.json({
                    status: 202,
                    message: 'Invalid category'
                });
            }

            // Make sure the Main Filter belongs to this tenant's category
            var FILTER_QRY = "SELECT cf.id FROM catalog_filters cf " +
                "INNER JOIN categories c ON c.id = cf.category_id " +
                "WHERE cf.id = ? " +
                "AND c.tenant_id = ? " +
                "AND IFNULL(cf.d_in, 0) = 0";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                FILTER_QRY,
                [id, tenant_id],
                'updatemainfilter-check-filter',
                function (err2, filterRows) {
                    if (err2) {
                        console.log('UPDATE MAIN FILTER CHECK ERROR:', err2);
                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!filterRows || filterRows.length === 0) {
                        return res.json({
                            status: 202,
                            message: 'Main filter not found'
                        });
                    }

                    var QRY = "UPDATE catalog_filters " +
                        "SET category_id = ?, filter_name = ? " +
                        "WHERE id = ? " +
                        "AND IFNULL(d_in, 0) = 0";

                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        QRY,
                        [category_id, filter_name.trim(), id],
                        'updatemainfilter',
                        function (err3, result) {
                            if (err3) {
                                console.log('UPDATE MAIN FILTER ERROR:', err3);
                                return res.json({
                                    status: 500,
                                    message: 'Internal server error'
                                });
                            }

                            if (!result || !result.affectedRows) {
                                return res.json({
                                    status: 202,
                                    message: 'Main filter not found'
                                });
                            }

                            return res.json({
                                status: 200,
                                message: 'Main filter updated successfully'
                            });
                        }
                    );
                }
            );
        }
    );
};
// DELETE /deletemainfilter/:id
exports.deletemainfilter = function (req, res) {
    var tenant_id = req.admin.tenant_id;
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Main filter ID is required'
        });
    }

    // Make sure the Main Filter belongs to the logged-in tenant
    var CHECK_QRY = "SELECT cf.id FROM catalog_filters cf " +
        "INNER JOIN categories c ON c.id = cf.category_id " +
        "WHERE cf.id = ? " +
        "AND c.tenant_id = ? " +
        "AND IFNULL(cf.d_in, 0) = 0";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        CHECK_QRY,
        [id, tenant_id],
        'deletemainfilter-check',
        function (err, rows) {
            if (err) {
                console.log('DELETE MAIN FILTER CHECK ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || rows.length === 0) {
                return res.json({
                    status: 202,
                    message: 'Main filter not found'
                });
            }

            // Physical delete — the row is permanently removed
            var QRY = "DELETE FROM catalog_filters " +
                "WHERE id = ?";

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                [id],
                'deletemainfilter',
                function (err2, result) {
                    if (err2) {
                        console.log('DELETE MAIN FILTER ERROR:', err2);
                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {
                        return res.json({
                            status: 202,
                            message: 'Main filter not found'
                        });
                    }

                    return res.json({
                        status: 200,
                        message: 'Main filter deleted successfully'
                    });
                }
            );
        }
    );
};
// Customers
exports.getcustomers = function(req, res) {

    var tenant_id = req.admin.tenant_id;

    var QRY = `
        SELECT
            c.*,

            COALESCE(
                (
                    SELECT ca.full_address
                    FROM customer_addresses ca
                    WHERE ca.customer_id = c.id
                      AND ca.d_in = 0
                      AND ca.is_default = 1
                    LIMIT 1
                ),
                (
                    SELECT ca.full_address
                    FROM customer_addresses ca
                    WHERE ca.customer_id = c.id
                      AND ca.d_in = 0
                    ORDER BY ca.id ASC
                    LIMIT 1
                )
            ) AS location,

            (
                SELECT COUNT(*)
                FROM orders o
                WHERE o.customer_id = c.id
                  AND o.d_in = 0
                  AND o.order_status = 4
            ) AS completed_orders,

            (
                SELECT COUNT(*)
                FROM orders o
                WHERE o.customer_id = c.id
                  AND o.d_in = 0
                  AND o.order_status IN (0, 1, 2, 3)
            ) AS pending_orders,

            (
                SELECT COUNT(*)
                FROM orders o
                WHERE o.customer_id = c.id
                  AND o.d_in = 0
                  AND o.order_status IN (5, 6)
            ) AS rejected_orders,

            (
                SELECT COUNT(*)
                FROM orders o
                WHERE o.customer_id = c.id
                  AND o.d_in = 0
            ) AS total_orders,

            (
                SELECT GROUP_CONCAT(DISTINCT v.location_id)
                FROM orders o
                INNER JOIN vendors v ON v.id = o.vendor_id
                WHERE o.customer_id = c.id
                  AND o.d_in = 0
            ) AS location_ids

        FROM customers c
        WHERE c.tenant_id = ?
          AND c.d_in = 0
        ORDER BY c.i_ts DESC
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getcustomers',
        function(err, rows) {

          if (err) {
    console.log('getcustomers SQL ERROR:', err);
    return res.json({
        status: 500,
        message: 'Internal server error',
        error: err.message
    });
}

            return res.json({
                status: 200,
                data: rows
            });
        }
    );

};

exports.getcustomerdetails = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'SELECT * FROM customers WHERE id=? AND tenant_id=? AND d_in=0', [req.body.customer_id, req.admin.tenant_id], 'getcustomerdetails', function(err, rows) {
        if (err || !rows.length) return res.json({ status: 500, message: 'Customer not found' });
        var customer = rows[0];
        dbutil.sqlinjection(sqldb.MySQLConPool, 'SELECT * FROM customer_addresses WHERE customer_id=? AND d_in=0', [req.body.customer_id], 'getcustomerdetails-addr', function(err2, addrs) {
            customer.addresses = addrs || [];
            return res.json({ status: 200, data: customer });
        });
    });
};

exports.updatecustomeractivestatus = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'UPDATE customers SET active_status=? WHERE id=? AND tenant_id=?', [req.body.value != undefined ? req.body.value : req.body.active_status, req.body.id, req.admin.tenant_id], 'updatecustomeractivestatus', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Status updated' });
    });
};

// Banners
// Banners
exports.addbanner = function(req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    // Multer saves the image in the common uploads folder.
    var bannerImage = req.file
        ? getUploadedImagePath(req.file.filename)
        : null;

    var QRY = `
        INSERT INTO banners
        (
            tenant_id,
            location_id,
            banner_image,
            link_type,
            vendor_id,
            product_id,
            external_url,
            banner_order,
            is_active,
            i_ts
        )
        VALUES (?,?,?,?,?,?,?,?,?,NOW())
    `;

    var params = [
        tenant_id,
        b.location_id || null,
        bannerImage,
        b.link_type || null,
        b.vendor_id || null,
        b.product_id || null,
        b.external_url || null,
        b.banner_order || 0,
        b.is_active != undefined ? b.is_active : 1
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'addbanner',
        function(err) {

            if (err) {
                console.log('ADD BANNER ERROR:', err);

                // Remove newly uploaded file if DB insert failed.
                deleteUploadedFile(bannerImage);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Banner added'
            });
        }
    );
};

exports.getbanners = function(req, res) {

    var QRY = `
        SELECT
            b.*,
            v.vendor_name,
            CONCAT(IFNULL(l.city, ''), ' ', IFNULL(l.area, '')) AS location
        FROM banners b
        LEFT JOIN vendors v ON v.id = b.vendor_id
        LEFT JOIN locations l ON l.id = b.location_id
        WHERE b.tenant_id = ?
          AND b.d_in = 0
        ORDER BY b.banner_order
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [req.admin.tenant_id],
        'getbanners',
        function(err, rows) {

            if (err) {
                console.log('GET BANNERS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            rows = rows.map(function(row) {
                return {
                    ...row,
                    banner_image: getPublicImageUrl(row.banner_image, req)
                };
            });

            return res.json({
                status: 200,
                data: rows
            });
        }
    );
};

exports.updatebanner = function(req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Banner ID is required'
        });
    }

    // If no new image is selected, update only the other fields.
    if (!req.file) {

        var QRY = `
            UPDATE banners
            SET
                link_type=?,
                vendor_id=?,
                product_id=?,
                external_url=?,
                banner_order=?,
                is_active=?
            WHERE id=?
              AND tenant_id=?
        `;

        var params = [
            b.link_type || null,
            b.vendor_id || null,
            b.product_id || null,
            b.external_url || null,
            b.banner_order || 0,
            b.is_active != undefined ? b.is_active : 1,
            b.id,
            tenant_id
        ];

        return dbutil.sqlinjection(
            sqldb.MySQLConPool,
            QRY,
            params,
            'updatebanner',
            function(err, result) {

                if (err) {
                    console.log('UPDATE BANNER ERROR:', err);

                    return res.json({
                        status: 500,
                        message: 'Internal server error'
                    });
                }

                if (!result || !result.affectedRows) {
                    return res.json({
                        status: 202,
                        message: 'Banner not found'
                    });
                }

                return res.json({
                    status: 200,
                    message: 'Banner updated'
                });
            }
        );
    }

    // New image selected.
    var newImagePath = getUploadedImagePath(req.file.filename);

    var getOldImageQRY = `
        SELECT banner_image
        FROM banners
        WHERE id=?
          AND tenant_id=?
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getOldImageQRY,
        [b.id, tenant_id],
        'updatebanner-get-old-image',
        function(err, rows) {

            if (err) {
                deleteUploadedFile(newImagePath);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                deleteUploadedFile(newImagePath);

                return res.json({
                    status: 202,
                    message: 'Banner not found'
                });
            }

            var oldImagePath = rows[0].banner_image;

            var QRY = `
                UPDATE banners
                SET
                    banner_image=?,
                    link_type=?,
                    vendor_id=?,
                    product_id=?,
                    external_url=?,
                    banner_order=?,
                    is_active=?
                WHERE id=?
                  AND tenant_id=?
            `;

            var params = [
                newImagePath,
                b.link_type || null,
                b.vendor_id || null,
                b.product_id || null,
                b.external_url || null,
                b.banner_order || 0,
                b.is_active != undefined ? b.is_active : 1,
                b.id,
                tenant_id
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'updatebanner',
                function(updateErr, result) {

                    if (updateErr) {

                        console.log(
                            'UPDATE BANNER ERROR:',
                            updateErr
                        );

                        // Remove new file when DB update failed.
                        deleteUploadedFile(newImagePath);

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {

                        deleteUploadedFile(newImagePath);

                        return res.json({
                            status: 202,
                            message: 'Banner not found'
                        });
                    }

                    // Remove old physical image after successful DB update.
                    if (oldImagePath &&
                        oldImagePath !== newImagePath) {

                        deleteUploadedFile(oldImagePath);
                    }

                    return res.json({
                        status: 200,
                        message: 'Banner updated'
                    });
                }
            );
        }
    );
};

// Hard delete
exports.deletebanner = function(req, res) {

    var id = req.body.id;
    var tenant_id = req.admin.tenant_id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Banner ID is required'
        });
    }

    // Get image path before deleting the DB record.
    var getImageQRY = `
        SELECT banner_image
        FROM banners
        WHERE id=?
          AND tenant_id=?
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getImageQRY,
        [id, tenant_id],
        'deletebanner-get-image',
        function(err, rows) {

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                return res.json({
                    status: 202,
                    message: 'Banner not found'
                });
            }

            var imagePath = rows[0].banner_image;

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                'DELETE FROM banners WHERE id = ? AND tenant_id = ?',
                [id, tenant_id],
                'deletebanner',
                function(err2, result) {

                    if (err2) {
                        console.log(
                            'DELETE BANNER ERROR:',
                            err2
                        );

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {
                        return res.json({
                            status: 202,
                            message: 'Banner not found'
                        });
                    }

                    // Remove physical image after successful DB delete.
                    deleteUploadedFile(imagePath);

                    return res.json({
                        status: 200,
                        message: 'Banner deleted successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};
// Coupons
// Coupons
// The coupons table carries two generations of columns. The dashboard UI and
// the coupons grid both use the newer set (coupon_code, discount_type,
// discount_value, min_order_value, valid_from, valid_upto, vendor_id,
// category_id), so that is what these endpoints read and write. The legacy
// columns (coupon_name, coupon_percentage, validate_from ...) are deliberately
// left untouched rather than dropped, so nothing that still reads them breaks.
exports.addcoupon = function(req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.coupon_code) {
        return res.json({
            status: 202,
            message: 'Coupon code is required'
        });
    }

    var QRY =
        "INSERT INTO coupons (" +
        "tenant_id, vendor_id, category_id, location_id, " +
        "coupon_code, description, discount_type, discount_value, " +
        "max_discount_amount, min_order_value, usage_limit_per_user, " +
        "total_usage_limit, valid_from, valid_upto, is_active, i_ts, d_in" +
        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)";

    var params = [
        tenant_id,
nullableNum(b.vendor_id ?? b.shop_id),
        nullableNum(b.category_id),
        b.location_id != null ? Number(b.location_id) : 0,
        b.coupon_code,
        b.description || null,
        b.discount_type || 'percentage',
        num(b.discount_value, 0),
        nullableNum(b.max_discount_amount),
        num(b.min_order_value, 0),
        num(b.usage_limit_per_user, 1),
        nullableNum(b.total_usage_limit),
        b.valid_from || null,
        b.valid_upto || null,
        b.is_active !== undefined ? Number(b.is_active) : 1
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'addcoupon',
        function(err, result) {
            if (err) {
                console.log('ADD COUPON ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            return res.json({
                status: 200,
                message: 'Coupon added successfully',
                insertId: result ? result.insertId : null
            });
        }
    );
};
exports.updatecoupon = function(req, res) {
    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Coupon ID is required'
        });
    }

    if (!b.coupon_code) {
        return res.json({
            status: 202,
            message: 'Coupon code is required'
        });
    }

    var QRY =
        "UPDATE coupons SET " +
        "vendor_id = ?, " +
        "category_id = ?, " +
        "location_id = ?, " +
        "coupon_code = ?, " +
        "description = ?, " +
        "discount_type = ?, " +
        "discount_value = ?, " +
        "max_discount_amount = ?, " +
        "min_order_value = ?, " +
        "usage_limit_per_user = ?, " +
        "total_usage_limit = ?, " +
        "valid_from = ?, " +
        "valid_upto = ?, " +
        "is_active = ? " +
        "WHERE id = ? " +
        "AND tenant_id = ? " +
        "AND IFNULL(d_in, 0) = 0";

    var params = [
nullableNum(b.vendor_id ?? b.shop_id),
        nullableNum(b.category_id),
        b.location_id != null ? Number(b.location_id) : 0,
        b.coupon_code,
        b.description || null,
        b.discount_type || 'percentage',
        num(b.discount_value, 0),
        nullableNum(b.max_discount_amount),
        num(b.min_order_value, 0),
        num(b.usage_limit_per_user, 1),
        nullableNum(b.total_usage_limit),
        b.valid_from || null,
        b.valid_upto || null,
        b.is_active !== undefined ? Number(b.is_active) : 1,
        b.id,
        tenant_id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'updatecoupon',
        function(err, result) {
            if (err) {
                console.log('UPDATE COUPON ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            if (!result || !result.affectedRows) {
                return res.json({
                    status: 202,
                    message: 'Coupon not found'
                });
            }

            return res.json({
                status: 200,
                message: 'Coupon updated successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};
exports.getcoupons = function(req, res) {
    var tenant_id = req.admin.tenant_id;

    var QRY =
        "SELECT " +
        "co.id, " +
        "co.tenant_id, " +
        "co.vendor_id, " +
        "co.category_id, " +
        "co.location_id, " +
        "co.coupon_code, " +
        "co.description, " +
        "co.discount_type, " +
        "co.discount_value, " +
        "co.max_discount_amount, " +
        "co.min_order_value, " +
        "co.usage_limit_per_user, " +
        "co.total_usage_limit, " +
        "co.valid_from, " +
        "co.valid_upto, " +
        "co.is_active, " +
        "co.i_ts, " +
        "co.d_in, " +
        "v.vendor_name AS shop_name, " +
        "cat.category_name AS category_name, " +
        "CONCAT_WS(', ', loc.area, loc.city) AS location_name " +
        "FROM coupons co " +
        "LEFT JOIN vendors v ON v.id = co.vendor_id " +
        "AND v.tenant_id = co.tenant_id " +
        "AND IFNULL(v.d_in, 0) = 0 " +
        "LEFT JOIN categories cat ON cat.id = co.category_id " +
        "AND cat.tenant_id = co.tenant_id " +
        "AND IFNULL(cat.d_in, 0) = 0 " +
        "LEFT JOIN locations loc ON loc.id = co.location_id " +
        "AND loc.tenant_id = co.tenant_id " +
        "AND IFNULL(loc.d_in, 0) = 0 " +
        "WHERE co.tenant_id = ? " +
        "AND IFNULL(co.d_in, 0) = 0 " +
        "ORDER BY co.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getcoupons',
        function(err, rows) {
            if (err) {
                console.log('GET COUPONS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            return res.json({
                status: 200,
                message: 'Coupons fetched successfully',
                data: rows || []
            });
        }
    );
};


exports.deletecoupon = function(req, res) {
    var id = req.body.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Coupon ID is required'
        });
    }

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        'DELETE FROM coupons WHERE id=? AND tenant_id=?',
        [id, req.admin.tenant_id],
        'deletecoupon',
        function(err, result) {
            if (err) {
                console.log('DELETE COUPON ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!result || !result.affectedRows) {
                return res.json({
                    status: 202,
                    message: 'Coupon not found'
                });
            }

            return res.json({
                status: 200,
                message: 'Coupon deleted successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};

// Notifications
exports.addnotification = function(req, res) {
    var b = req.body; var tenant_id = req.admin.tenant_id;
    var QRY = "INSERT INTO notifications (tenant_id, title, message, target_type, notification_type, sent_at, i_ts) VALUES (?,?,?,?,?,NOW(),NOW())";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenant_id, b.title, b.message, b.target_type||'all', b.notification_type||'system'], 'addnotification', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Notification sent' });
    });
};

exports.getnotifications = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'SELECT * FROM notifications WHERE tenant_id=? AND d_in=0 ORDER BY sent_at DESC', [req.admin.tenant_id], 'getnotifications', function(err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows });
    });
};

exports.deletenotification = function(req, res) {
    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        'DELETE FROM notifications WHERE id=? AND tenant_id=?',
        [req.body.id, req.admin.tenant_id],
        'deletenotification',
        function(err) {

            if (err) {

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Deleted permanently'
            });

        }
    );

};
// Update Notification
exports.updatenotification = function(req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    var QRY = `
        UPDATE notifications
        SET
            title = ?,
            message = ?
        WHERE id = ?
          AND tenant_id = ?
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [
            b.title,
            b.message,
            b.id,
            tenant_id
        ],
        'updatenotification',
        function(err) {

            if (err) {
                console.log('UPDATE NOTIFICATION ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Notification updated'
            });
        }
    );
};
// Vendor Settlements
// GET /getcodsettlements - COD settlements for the tenant's delivery partners.
// delivery_partner_settlements carries no tenant_id of its own, so the tenant
// is reached through delivery_partners - the same shape getvendorsettlements
// uses for vendors. Read-only: no payout action is implied by existing code.
exports.getcodsettlements = function(req, res) {

    var QRY =
        "SELECT " +
        "dps.id, " +
        "dps.delivery_partner_id, " +
        "dps.delivery_assignment_id, " +
        "dps.settlement_period_start, " +
        "dps.settlement_period_end, " +
        "dps.total_orders, " +
        "dps.cod_amount_collected, " +
        "dps.delivery_earnings, " +
        "dps.advance_deducted, " +
        "dps.net_payable, " +
        "dps.settlement_status, " +
        "dps.paid_at, " +
        "dps.i_ts, " +
        "dp.name AS delivery_partner_name, " +
        "dp.mobile_number, " +
        "dp.profile_image, " +
        "o.order_date_time AS order_date " +

        "FROM delivery_partner_settlements dps " +

        "INNER JOIN delivery_partners dp " +
        "ON dp.id = dps.delivery_partner_id " +

        "LEFT JOIN delivery_assignments da " +
        "ON da.id = dps.delivery_assignment_id " +

        "LEFT JOIN orders o " +
        "ON o.id = da.order_id " +

        "WHERE dp.tenant_id = ? " +
        "AND IFNULL(dps.d_in,0) = 0 " +

        "ORDER BY dps.i_ts DESC";


    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [req.admin.tenant_id],
        'getcodsettlements',
        function(err, rows) {

            if (err) {

                console.log(
                    'GET COD SETTLEMENTS ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });

            }

            rows = rows || [];

            var settlements = rows.filter(function(row) {

                return Number(row.settlement_status) === 0;

            });

            var history = rows.filter(function(row) {

                return (
                    row.paid_at !== null &&
                    row.paid_at !== undefined
                ) ||
                Number(row.settlement_status) === 1 ||
                Number(row.settlement_status) === 2;

            });

            return res.json({

                status: 200,

                settlements: settlements,

                history: history,

                data: rows

            });

        }
    );

};
exports.paycodsettlement = function(req, res) {

    var settlementId = req.body.settlement_id;

    if (!settlementId) {

        return res.json({
            status: 400,
            message: 'Settlement ID is required'
        });

    }

    var QRY =
        "UPDATE delivery_partner_settlements dps " +
        "INNER JOIN delivery_partners dp " +
        "ON dp.id = dps.delivery_partner_id " +
        "SET " +
        "dps.settlement_status = 1, " +
        "dps.paid_at = NOW() " +
        "WHERE dps.id = ? " +
        "AND dp.tenant_id = ? " +
        "AND IFNULL(dps.d_in,0) = 0 " +
        "AND IFNULL(dps.settlement_status,0) = 0";


    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [
            settlementId,
            req.admin.tenant_id
        ],
        'paycodsettlement',
        function(err, result) {

            if (err) {

                console.log(
                    'PAY COD SETTLEMENT ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });

            }

            if (!result || result.affectedRows === 0) {

                return res.json({
                    status: 404,
                    message: 'Settlement not found or already settled'
                });

            }

            return res.json({
                status: 200,
                message: 'COD settlement paid successfully'
            });

        }
    );

};
// Delivery Boy Payments
// Returns pending/unpaid delivery partner settlements for the current tenant.
exports.getdeliveryboypayments = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var b = req.body || {};

    var conditions = [
        'dp.tenant_id=?',
        'IFNULL(dps.d_in,0)=0',
    ];

    var params = [tenant_id];

    // Delivery Boy filter
    if (b.delivery_partner_id) {
        conditions.push('dps.delivery_partner_id=?');
        params.push(b.delivery_partner_id);
    }

    // Location filter
    if (b.location_id) {
        conditions.push('dp.location_id=?');
        params.push(b.location_id);
    }

    // From Date + To Date
    if (b.from_date && b.to_date) {
        conditions.push(
            'dps.settlement_period_start >= ? AND dps.settlement_period_end <= ?'
        );

        params.push(
            b.from_date,
            b.to_date
        );
    }

    var WHERE = conditions.join(' AND ');

    var QRY =
        "SELECT " +
        "dps.id, " +
        "dps.delivery_partner_id, " +
        "dps.settlement_period_start, " +
        "dps.settlement_period_end, " +
    "dps.cod_amount_collected AS total_amount, " +
"dps.total_orders, " +
"CASE " +
"WHEN dps.total_orders > 0 " +
"THEN ROUND(dps.delivery_earnings / dps.total_orders, 2) " +
"ELSE 0 " +
"END AS amount_per_order, " +
"dps.net_payable AS net_pay, " +
        "dps.settlement_status, " +
        "dps.paid_at, " +
        "dps.i_ts, " +
        "dp.name AS delivery_partner_name, " +
        "dp.mobile_number, " +
        "dp.profile_image, " +
        "dp.location_id " +
        "FROM delivery_partner_settlements dps " +
        "INNER JOIN delivery_partners dp " +
        "ON dp.id=dps.delivery_partner_id " +
        "WHERE " + WHERE +
        " ORDER BY dps.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'getdeliveryboypayments',
        function(err, rows) {

            if (err) {

                console.log(
                    'GET DELIVERY BOY PAYMENTS ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });
        }
    );
};
// Delivery Boy Payment History
// Returns paid/processed delivery partner settlements for the current tenant.
exports.getdeliveryboypaymenthistory = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var b = req.body || {};

    var conditions = [
        'dp.tenant_id=?',
        'IFNULL(dps.d_in,0)=0',
        '(dps.paid_at IS NOT NULL OR dps.settlement_status IN (1,2))'
    ];

    var params = [tenant_id];

    // Delivery Boy filter
    if (b.delivery_partner_id) {
        conditions.push('dps.delivery_partner_id=?');
        params.push(b.delivery_partner_id);
    }

    // Location filter
    if (b.location_id) {
        conditions.push('dp.location_id=?');
        params.push(b.location_id);
    }

    // From Date + To Date
    if (b.from_date && b.to_date) {
        conditions.push(
            'dps.settlement_period_start >= ? AND dps.settlement_period_end <= ?'
        );

        params.push(
            b.from_date,
            b.to_date
        );
    }

    var WHERE = conditions.join(' AND ');

    var QRY =
        "SELECT " +
        "dps.id, " +
        "dps.delivery_partner_id, " +
        "dps.settlement_period_start, " +
        "dps.settlement_period_end, " +
        "dps.total_orders, " +
        "dps.cod_amount_collected AS total_amount, " +
        "CASE " +
        "WHEN dps.total_orders > 0 " +
        "THEN ROUND(dps.delivery_earnings / dps.total_orders, 2) " +
        "ELSE 0 " +
        "END AS amount_per_order, " +
        "dps.delivery_earnings, " +
        "dps.advance_deducted, " +
        "dps.net_payable AS net_pay, " +
        "dps.settlement_status, " +
        "dps.paid_at, " +
        "dps.i_ts, " +
        "dp.name AS delivery_partner_name, " +
        "dp.mobile_number, " +
        "dp.profile_image, " +
        "dp.location_id " +
        "FROM delivery_partner_settlements dps " +
        "INNER JOIN delivery_partners dp " +
        "ON dp.id=dps.delivery_partner_id " +
        "WHERE " + WHERE +
        " ORDER BY dps.paid_at DESC, dps.i_ts DESC";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'getdeliveryboypaymenthistory',
        function(err, rows) {

            if (err) {

                console.log(
                    'GET DELIVERY BOY PAYMENT HISTORY ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });
        }
    );
};
exports.getvendorsettlements = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var b = req.body || {};

    var conditions = [
        'v.tenant_id = ?',
        'vs.d_in = 0'
    ];

    var params = [tenant_id];

    // Date filter
    if (b.from_date && b.to_date) {
        conditions.push(
            'vs.period_start >= ? AND vs.period_end <= ?'
        );

        params.push(
            b.from_date,
            b.to_date
        );
    }

    // Location filter
    if (b.location_id) {
        conditions.push('v.location_id = ?');
        params.push(b.location_id);
    }

    // Vendor filter
    if (b.vendor_id) {
        conditions.push('vs.vendor_id = ?');
        params.push(b.vendor_id);
    }

    var WHERE = conditions.join(' AND ');

    var QRY =
        "SELECT " +
        "vs.id, " +
        "vs.vendor_id, " +
        "vs.settlement_number, " +
        "vs.period_start, " +
        "vs.period_end, " +
        "vs.total_orders, " +
        "vs.gross_sales, " +
        "vs.commission_amount, " +
        "vs.net_payable, " +
        "vs.settlement_status, " +
        "vs.i_ts, " +
        "v.vendor_name, " +
        "v.shop_image, " +
        "v.location_id, " +
        "v.store_category " +
        "FROM vendor_settlements vs " +
        "LEFT JOIN vendors v ON v.id = vs.vendor_id " +
        "WHERE " + WHERE +
        " ORDER BY vs.i_ts DESC";

    console.log('GET VENDOR SETTLEMENTS SQL:', QRY);
    console.log('GET VENDOR SETTLEMENTS PARAMS:', params);

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'getvendorsettlements',
        function(err, rows) {

            if (err) {
                console.log(
                    'GET VENDOR SETTLEMENTS ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });
        }
    );
};

exports.createvendorsettlement = function(req, res) {
    var b = req.body;
    var num = 'SET-' + Date.now();
    var QRY = "INSERT INTO vendor_settlements (vendor_id, settlement_number, period_start, period_end, total_orders, gross_sales, commission_amount, net_payable, settlement_status, i_ts) VALUES (?,?,?,?,?,?,?,?,0,NOW())";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [b.vendor_id, num, b.period_start, b.period_end, b.total_orders||0, b.gross_sales||0, b.commission_amount||0, b.net_payable||0], 'createvendorsettlement', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Settlement created' });
    });
};

exports.submitvendorpayout = function(req, res) {
    var b = req.body;
    var QRY = "INSERT INTO vendor_payouts (vendor_settlement_id, payout_amount, payout_method, transaction_reference, payout_proof, payout_status, paid_at, i_ts) VALUES (?,?,?,?,?,1,NOW(),NOW())";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [b.vendor_settlement_id, b.payout_amount, b.payout_method, b.transaction_reference||null, b.payout_proof||null], 'submitvendorpayout', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        dbutil.sqlinjection(sqldb.MySQLConPool, 'UPDATE vendor_settlements SET settlement_status=2 WHERE id=?', [b.vendor_settlement_id], 'submitvendorpayout-update', function() {});
        return res.json({ status: 200, message: 'Payout submitted' });
    });
};

exports.getcharges = function(req, res) {

    var tenant_id = req.admin.tenant_id;

    var QRY = `
        SELECT *
        FROM tenant_charge_settings
        WHERE tenant_id = ?
        AND d_in = 0
        ORDER BY id DESC
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getcharges',
        function(err, rows) {

            if (err) {

                console.log('GET CHARGES ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });

        }
    );
};


exports.addcharges = function(req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    var QRY = `
        INSERT INTO tenant_charge_settings
        (
            tenant_id,
            handling_charge,
            packing_charge,
            donation_charge,
            rain_surge_charge,
            rain_surge_active,
            i_ts,
            d_in
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [
            tenant_id,
            num(b.handling_charge, 0),
            num(b.packing_charge, 0),
            num(b.donation_charge, 0),
            num(b.rain_surge_charge, 0),
            num(b.rain_surge_active, 0)
        ],
        'addcharges',
        function(err, result) {

            console.log('ADD CHARGES ERROR:', err);
            console.log('ADD CHARGES RESULT:', result);

            if (err) {
                return res.json({
                    status: 500,
                    message: 'Internal server error',
                    error: err.message
                });
            }

            return res.json({
                status: 200,
                message: 'Charges added successfully',
                insertId: result.insertId
            });
        }
    );
};


exports.updatecharges = function (req, res) {

    var b = req.body;
    var tenant_id = req.admin.tenant_id;

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Charge ID is required'
        });
    }

    var QRY = `
        UPDATE tenant_charge_settings
        SET
            handling_charge = ?,
            packing_charge = ?,
            donation_charge = ?,
            rain_surge_charge = ?,
            rain_surge_active = ?
        WHERE id = ?
          AND tenant_id = ?
          AND IFNULL(d_in, 0) = 0
    `;

    var params = [
        num(b.handling_charge, 0),
        num(b.packing_charge, 0),
        num(b.donation_charge, 0),
        num(b.rain_surge_charge, 0),
        num(b.rain_surge_active, 0),
        b.id,
        tenant_id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'updatecharges',
        function (err, result) {

            if (err) {
                console.log('UPDATE CHARGES ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!result || !result.affectedRows) {
                return res.json({
                    status: 202,
                    message: 'Charges not found'
                });
            }

            return res.json({
                status: 200,
                message: 'Charges updated successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};

exports.getpaymentgateway = function(req, res) {
    dbutil.sqlinjection(sqldb.MySQLConPool, 'SELECT * FROM payment_gateway_settings WHERE tenant_id=? AND d_in=0', [req.admin.tenant_id], 'getpaymentgateway', function(err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, data: rows || [] });
    });
};

exports.updatepaymentgateway = function(req, res) {
    var b = req.body; var tenant_id = req.admin.tenant_id;
    var QRY = "INSERT INTO payment_gateway_settings (tenant_id, gateway_name, api_key, api_secret, webhook_secret, is_active, i_ts) VALUES (?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE gateway_name=VALUES(gateway_name), api_key=VALUES(api_key), api_secret=VALUES(api_secret), webhook_secret=VALUES(webhook_secret), is_active=VALUES(is_active)";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenant_id, b.gateway_name, b.api_key||null, b.api_secret||null, b.webhook_secret||null, b.is_active!=undefined?b.is_active:1], 'updatepaymentgateway', function(err) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        return res.json({ status: 200, message: 'Payment gateway updated' });
    });
};

// Toggle tenant payment modes. COD is stored explicitly; online is derived from
// the gateway settings row and only becomes active when credentials are saved.
exports.updatepaymentmodes = function(req, res) {
    var b = req.body || {};
    var tenant_id = req.admin.tenant_id;

    function getPaymentModesSummary(callback) {
        var QRY = "SELECT " +
            "(SELECT IFNULL(MAX(c.cod_enabled), 1) FROM tenant_charge_settings c WHERE c.tenant_id = ? AND IFNULL(c.d_in, 0) = 0) AS cod_enabled, " +
            "(SELECT COUNT(*) FROM payment_gateway_settings g WHERE g.tenant_id = ? AND IFNULL(g.d_in, 0) = 0 AND IFNULL(g.api_key, '') <> '' AND IFNULL(g.api_secret, '') <> '') AS online_configured, " +
            "(SELECT COUNT(*) FROM payment_gateway_settings g WHERE g.tenant_id = ? AND IFNULL(g.d_in, 0) = 0 AND g.is_active = 1 AND IFNULL(g.api_key, '') <> '' AND IFNULL(g.api_secret, '') <> '') AS online_enabled, " +
            "(SELECT g.gateway_name FROM payment_gateway_settings g WHERE g.tenant_id = ? AND IFNULL(g.d_in, 0) = 0 ORDER BY g.id DESC LIMIT 1) AS gateway_name";

        dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [tenant_id, tenant_id, tenant_id, tenant_id], 'updatepaymentmodes-summary', function (err, rows) {
            if (err) return callback(err, null);
            callback(null, (rows && rows[0]) || {
                cod_enabled: 1,
                online_configured: 0,
                online_enabled: 0,
                gateway_name: null
            });
        });
    }

    getPaymentModesSummary(function (err, before) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });

        function finalize(after, restoredCod) {
            var msg = restoredCod ? 'Payment modes updated. Cash on delivery was switched back on so the tenant can still take payment.' : 'Payment modes updated';
            return res.json({ status: 200, message: msg, data: after });
        }

        function completeAfterMutation() {
            getPaymentModesSummary(function (summaryErr, after) {
                if (summaryErr) return res.json({ status: 500, message: 'Internal server error' });

                var restoredCod = false;
                if (!after.cod_enabled && !after.online_enabled) {
                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        'UPDATE tenant_charge_settings SET cod_enabled = 1 WHERE tenant_id = ? AND IFNULL(d_in,0) = 0',
                        [tenant_id],
                        'updatepaymentmodes-restore-cod',
                        function (restoreErr, restoreResult) {
                            if (restoreErr) return res.json({ status: 500, message: 'Internal server error' });
                            if (!restoreResult || !restoreResult.affectedRows) {
                                dbutil.sqlinjection(
                                    sqldb.MySQLConPool,
                                    'INSERT INTO tenant_charge_settings (tenant_id, cod_enabled, i_ts) VALUES (?, 1, NOW())',
                                    [tenant_id],
                                    'updatepaymentmodes-insert-cod',
                                    function (insertErr) {
                                        if (insertErr) return res.json({ status: 500, message: 'Internal server error' });
                                        getPaymentModesSummary(function (finalErr, finalAfter) {
                                            if (finalErr) return res.json({ status: 500, message: 'Internal server error' });
                                            return finalize(finalAfter, true);
                                        });
                                    }
                                );
                                return;
                            }
                            getPaymentModesSummary(function (finalErr, finalAfter) {
                                if (finalErr) return res.json({ status: 500, message: 'Internal server error' });
                                return finalize(finalAfter, true);
                            });
                        }
                    );
                    return;
                }

                return finalize(after, false);
            });
        }

        function continueWithOnline() {
            if (b.online_enabled === undefined) {
                return completeAfterMutation();
            }

            var online = Number(b.online_enabled) === 1;
            if (online && Number(before.online_configured || 0) === 0) {
                return res.json({ status: 202, message: 'Please save your payment gateway credentials before enabling online payments.', data: before });
            }

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                'UPDATE payment_gateway_settings SET is_active = ? WHERE tenant_id = ? AND IFNULL(d_in,0) = 0',
                [online ? 1 : 0, tenant_id],
                'updatepaymentmodes-online',
                function (err2) {
                    if (err2) return res.json({ status: 500, message: 'Internal server error' });
                    completeAfterMutation();
                }
            );
        }

        if (b.cod_enabled === undefined) {
            return continueWithOnline();
        }

        var cod = Number(b.cod_enabled) === 1 ? 1 : 0;
        if (!cod && Number(before.online_enabled || 0) === 0) {
            return res.json({ status: 202, message: 'Cash on delivery cannot be switched off while no online payment option is enabled.', data: before });
        }

        dbutil.sqlinjection(
            sqldb.MySQLConPool,
            'UPDATE tenant_charge_settings SET cod_enabled = ? WHERE tenant_id = ? AND IFNULL(d_in,0) = 0',
            [cod, tenant_id],
            'updatepaymentmodes-cod',
            function (err2, result) {
                if (err2) return res.json({ status: 500, message: 'Internal server error' });
                if (!result || !result.affectedRows) {
                    dbutil.sqlinjection(
                        sqldb.MySQLConPool,
                        'INSERT INTO tenant_charge_settings (tenant_id, cod_enabled, i_ts) VALUES (?, ?, NOW())',
                        [tenant_id, cod],
                        'updatepaymentmodes-cod-insert',
                        function (insertErr) {
                            if (insertErr) return res.json({ status: 500, message: 'Internal server error' });
                            continueWithOnline();
                        }
                    );
                    return;
                }
                continueWithOnline();
            }
        );
    });
};
// Add Shop Item
exports.addshopitem = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var b = req.body;

    var shopImage = req.file
        ? getUploadedImagePath(req.file.filename)
        : null;

    var QRY = `
        INSERT INTO shopitems
        (
            tenant_id,
            subcategory,
            filter,
            item,
            description,
            measurement,
            actual_price,
            selling_price,
            available_time,
            discount_percentage,
            discount_amount,
            shop_image,
            i_ts,
            d_in
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)
    `;

    var params = [
        tenant_id,
        b.subcategory || null,
        b.filter || null,
        b.item || null,
        b.description || null,
        b.measurement || null,
        b.actual_price || 0,
        b.selling_price || 0,
        b.available_time || null,
        b.discount_percentage || 0,
        b.discount_amount || 0,
        shopImage
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'addshopitem',
        function(err, result) {

            if (err) {
                console.log('ADD SHOP ITEM ERROR:', err);

                deleteUploadedFile(shopImage);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Shop item added successfully',
                insertId: result.insertId
            });
        }
    );
};


// Update Shop Item
exports.updateshopitem = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var b = req.body;

    if (!b.id) {
        return res.json({
            status: 202,
            message: 'Shop item ID is required'
        });
    }

    // No new image selected.
    if (!req.file) {

        var QRY = `
            UPDATE shopitems
            SET
                subcategory = ?,
                filter = ?,
                item = ?,
                description = ?,
                measurement = ?,
                actual_price = ?,
                selling_price = ?,
                available_time = ?,
                discount_percentage = ?,
                discount_amount = ?
            WHERE id = ?
              AND tenant_id = ?
        `;

        var params = [
            b.subcategory,
            b.filter,
            b.item,
            b.description,
            b.measurement,
            b.actual_price,
            b.selling_price,
            b.available_time,
            b.discount_percentage,
            b.discount_amount,
            b.id,
            tenant_id
        ];

        return dbutil.sqlinjection(
            sqldb.MySQLConPool,
            QRY,
            params,
            'updateshopitem',
            function(err, result) {

                if (err) {
                    console.log('UPDATE SHOP ITEM ERROR:', err);

                    return res.json({
                        status: 500,
                        message: 'Internal server error'
                    });
                }

                if (!result || !result.affectedRows) {
                    return res.json({
                        status: 202,
                        message: 'Shop item not found'
                    });
                }

                return res.json({
                    status: 200,
                    message: 'Shop item updated successfully'
                });
            }
        );
    }

    // New image selected.
    var newImagePath = getUploadedImagePath(req.file.filename);

    var getOldImageQRY = `
        SELECT shop_image
        FROM shopitems
        WHERE id = ?
          AND tenant_id = ?
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getOldImageQRY,
        [b.id, tenant_id],
        'updateshopitem-get-old-image',
        function(err, rows) {

            if (err) {
                deleteUploadedFile(newImagePath);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                deleteUploadedFile(newImagePath);

                return res.json({
                    status: 202,
                    message: 'Shop item not found'
                });
            }

            var oldImagePath = rows[0].shop_image;

            var QRY = `
                UPDATE shopitems
                SET
                    subcategory = ?,
                    filter = ?,
                    item = ?,
                    description = ?,
                    measurement = ?,
                    actual_price = ?,
                    selling_price = ?,
                    available_time = ?,
                    discount_percentage = ?,
                    discount_amount = ?,
                    shop_image = ?
                WHERE id = ?
                  AND tenant_id = ?
            `;

            var params = [
                b.subcategory,
                b.filter,
                b.item,
                b.description,
                b.measurement,
                b.actual_price,
                b.selling_price,
                b.available_time,
                b.discount_percentage,
                b.discount_amount,
                newImagePath,
                b.id,
                tenant_id
            ];

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                QRY,
                params,
                'updateshopitem',
                function(updateErr, result) {

                    if (updateErr) {
                        console.log(
                            'UPDATE SHOP ITEM ERROR:',
                            updateErr
                        );

                        deleteUploadedFile(newImagePath);

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {
                        deleteUploadedFile(newImagePath);

                        return res.json({
                            status: 202,
                            message: 'Shop item not found'
                        });
                    }

                    if (oldImagePath &&
                        oldImagePath !== newImagePath) {

                        deleteUploadedFile(oldImagePath);
                    }

                    return res.json({
                        status: 200,
                        message: 'Shop item updated successfully'
                    });
                }
            );
        }
    );
};
// Shop Items
exports.getshopitems = function(req, res) {

    var tenant_id = req.admin.tenant_id;

    var QRY = `
        SELECT *
        FROM shopitems
        WHERE tenant_id = ?
          AND IFNULL(d_in, 0) = 0
        ORDER BY i_ts DESC
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [tenant_id],
        'getshopitems',
        function(err, rows) {

            if (err) {
                console.log('GET SHOP ITEMS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows
            });
        }
    );
};
exports.updateshopitemactivestatus = function(req, res) {

    var tenant_id = req.admin.tenant_id;

    var QRY = `
        UPDATE shopitems
        SET active_status = ?
        WHERE id = ?
          AND tenant_id = ?
    `;

    var params = [
        req.body.value,
        req.body.id,
        tenant_id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'updateshopitemactivestatus',
        function(err, result) {

            if (err) {
                console.log('UPDATE SHOP ITEM ACTIVE STATUS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                message: 'Shop item active status updated'
            });
        }
    );
};
// Delete Shop Item
exports.deleteshopitem = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var id = req.body.id;

    if (!id) {
        return res.json({
            status: 202,
            message: 'Shop item ID is required'
        });
    }

    // Get the image path before deleting the database record.
    var getImageQRY = `
        SELECT shop_image
        FROM shopitems
        WHERE id = ?
          AND tenant_id = ?
    `;

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        getImageQRY,
        [id, tenant_id],
        'deleteshopitem-get-image',
        function(err, rows) {

            if (err) {
                console.log('GET SHOP ITEM IMAGE ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            if (!rows || !rows.length) {
                return res.json({
                    status: 202,
                    message: 'Shop item not found'
                });
            }

            var imagePath = rows[0].shop_image;

            var deleteQRY = `
                DELETE FROM shopitems
                WHERE id = ?
                  AND tenant_id = ?
            `;

            dbutil.sqlinjection(
                sqldb.MySQLConPool,
                deleteQRY,
                [id, tenant_id],
                'deleteshopitem',
                function(deleteErr, result) {

                    if (deleteErr) {
                        console.log(
                            'DELETE SHOP ITEM ERROR:',
                            deleteErr
                        );

                        return res.json({
                            status: 500,
                            message: 'Internal server error'
                        });
                    }

                    if (!result || !result.affectedRows) {
                        return res.json({
                            status: 202,
                            message: 'Shop item not found'
                        });
                    }

                    // Delete the physical image after successful DB deletion.
                    deleteUploadedFile(imagePath);

                    return res.json({
                        status: 200,
                        message: 'Shop item deleted successfully',
                        affectedRows: result.affectedRows
                    });
                }
            );
        }
    );
};
// ======================== PRODUCT ASSIGNMENT ========================
exports.getproductassignment = function(req, res) {

    var tenant_id = req.admin.tenant_id;

    var category_id = req.body.category_id;
    var shop_id = req.body.shop_id;

    if (!category_id || !shop_id) {
        return res.json({
            status: 400,
            message: 'Category and shop are required'
        });
    }

    var QRY = `
        SELECT
            p.id,
            p.product_name AS item,
            p.product_code,
            p.description,
            p.base_price AS actual_price,
            p.discount_price AS selling_price,
            p.stock_quantity,
            p.is_veg,
            p.is_returnable,
            p.is_featured,
            p.is_available,
            p.active_status,
            p.category_id,
            p.vendor_id,
            v.shop_image
        FROM products p
        LEFT JOIN vendors v
            ON v.id = p.vendor_id
            AND v.tenant_id = ?
        WHERE p.category_id = ?
          AND p.d_in = 0
          AND p.active_status = 1
          AND p.is_available = 1
        ORDER BY p.i_ts DESC
    `;

    var params = [
        tenant_id,
        category_id
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'getproductassignment',
        function(err, rows) {

            if (err) {

                console.log(
                    'GET PRODUCT ASSIGNMENT ERROR:',
                    err
                );

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: rows || []
            });

        }
    );
};
// ================= PRODUCT ASSIGNMENT =================

exports.submitproductassignment = function(req, res) {

    var tenant_id = req.admin.tenant_id;

    var category_id = req.body.category_id;
    var shop_id = req.body.shop_id;
    var products = req.body.products;

    if (!category_id || !shop_id || !products || !Array.isArray(products) || products.length === 0) {
        return res.json({
            status: 400,
            message: 'Category, shop and products are required'
        });
    }

    var updated = 0;

    function updateNext(index) {

        if (index >= products.length) {
            return res.json({
                status: 200,
                message: 'Products assigned successfully',
                updated: updated
            });
        }

        var product_id = Number(products[index].id);

        if (!product_id) {
            return updateNext(index + 1);
        }

        var QRY = `
            UPDATE products p
            INNER JOIN vendors v
                ON v.id = ?
            SET p.vendor_id = ?
            WHERE p.id = ?
              AND p.category_id = ?
              AND v.tenant_id = ?
              AND p.d_in = 0
        `;

        var params = [
            shop_id,
            shop_id,
            product_id,
            category_id,
            tenant_id
        ];

        dbutil.sqlinjection(
            sqldb.MySQLConPool,
            QRY,
            params,
            'submitproductassignment',
            function(err, result) {

                if (err) {
                    console.log(
                        'PRODUCT ASSIGNMENT ERROR:',
                        err
                    );

                    return res.json({
                        status: 500,
                        message: 'Internal server error'
                    });
                }

                updated += result.affectedRows || 0;

                updateNext(index + 1);
            }
        );
    }

    updateNext(0);
};
exports.getpayments = function(req, res) {

    var tenant_id = req.admin.tenant_id;
    var b = req.body || {};

    console.log('GET PAYMENTS FILTERS:', b);

    var conditions = [
        'v.tenant_id = ?',
        'o.d_in = 0',
        'p.d_in = 0'
    ];

    var params = [tenant_id];

    // Payment gateway filter
    if (b.payment_gateway) {
        conditions.push('p.payment_gateway = ?');
        params.push(b.payment_gateway);
    }

    // Payment status filter
    if (
        b.payment_status !== null &&
        b.payment_status !== undefined &&
        b.payment_status !== ''
    ) {
        conditions.push('p.payment_status = ?');
        params.push(b.payment_status);
    }

    // Shop filter
    if (b.vendor_id) {
        conditions.push('o.vendor_id = ?');
        params.push(b.vendor_id);
    }

    // Location filter
    if (b.location_id) {
        conditions.push('v.location_id = ?');
        params.push(b.location_id);
    }

    // Category filter
    if (b.category_id) {
        conditions.push(`
            EXISTS (
                SELECT 1
                FROM order_items oi
                INNER JOIN product_variants pv
                    ON pv.id = oi.product_variant_id
                INNER JOIN products pr
                    ON pr.id = pv.product_id
                WHERE oi.order_id = o.id
                  AND pr.category_id = ?
            )
        `);

        params.push(b.category_id);
    }

    // Date filter
    if (b.from_date && b.to_date) {
        conditions.push(
            'p.paid_at >= ? AND p.paid_at < DATE_ADD(?, INTERVAL 1 DAY)'
        );

        params.push(
            b.from_date,
            b.to_date
        );
    }

    var WHERE = conditions.join(' AND ');

    var QRY =
        "SELECT " +
        "p.id, " +
        "p.order_id, " +
        "p.payment_gateway, " +
        "p.gateway_payment_id, " +
        "p.gateway_order_id, " +
        "p.amount, " +
        "p.currency, " +
        "p.payment_status, " +
        "p.paid_at, " +
        "p.i_ts " +

        "FROM payments p " +

        "LEFT JOIN orders o ON o.id = p.order_id " +

        "LEFT JOIN vendors v ON v.id = o.vendor_id " +

        "WHERE " + WHERE +

        " ORDER BY p.i_ts DESC";

    console.log('GET PAYMENTS SQL:', QRY);
    console.log('GET PAYMENTS PARAMS:', params);

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'getpayments',
        function(err, rows) {

            if (err) {

                console.log('GET PAYMENTS ERROR:', err);

                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });

            }

            return res.json({
                status: 200,
                data: rows || []
            });

        }
    );

};
exports.getcategoryimage = function (req, res) {
    var category_id = req.params.id;
var tenant_id = 1;
    var QRY = "SELECT category_image FROM categories " +
        "WHERE id = ? AND tenant_id = ? AND IFNULL(d_in, 0) = 0";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [category_id, tenant_id],
        'getcategoryimage',
        function (err, rows) {

            if (err) {
                console.log('GET CATEGORY IMAGE ERROR:', err);
                return res.status(500).send('Internal server error');
            }

            if (!rows || !rows.length || !rows[0].category_image) {
                return res.status(404).send('Image not found');
            }

            // Stored value is a data URL: "data:<mime>;base64,<data>"
            var match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(rows[0].category_image);
            if (!match) {
                return res.status(404).send('Image not found');
            }

            var imageBuffer = Buffer.from(match[2], 'base64');

            res.setHeader('Content-Type', match[1]);
            res.setHeader('Content-Length', imageBuffer.length);

            res.end(imageBuffer);
        }
    );
};
// =============================================
// WEBSITE MANAGEMENT CONTENT
// Home sections, promotional sections, testimonials and footer settings.
// Same shape as the existing website banner endpoints: tenant_id comes from the
// token, d_in is a soft delete, display_order + status drive the public site.
// =============================================

// GET /getwebsitehomesections
exports.getwebsitehomesections = function (req, res) {
    var QRY = "SELECT id, tenant_id, section_key, heading, subheading, image, display_order, status " +
        "FROM tenant_website_home_sections " +
        "WHERE tenant_id = ? AND IFNULL(d_in,0) = 0 " +
        "ORDER BY display_order ASC, id DESC";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.admin.tenant_id], 'getwebsitehomesections', function (err, rows) {
        if (err) {
            console.log('GET WEBSITE HOME SECTIONS ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, data: rows || [] });
    });
};

// POST /savewebsitehomesection
exports.savewebsitehomesection = function (req, res) {
    var b = req.body;
    if (!b.section_key) {
        return res.json({ status: 202, message: 'Section key is required' });
    }
    var QRY = "INSERT INTO tenant_website_home_sections " +
        "(tenant_id, section_key, heading, subheading, image, display_order, status) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)";
    var params = [
        req.admin.tenant_id,
        b.section_key,
        b.heading || '',
        b.subheading || '',
        b.image || '',
        b.display_order || 1,
        b.status !== undefined ? b.status : 1
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'savewebsitehomesection', function (err, result) {
        if (err) {
            console.log('SAVE WEBSITE HOME SECTION ERROR:', err);
            return res.json({ status: 500, message: 'Failed to save home section' });
        }
        return res.json({ status: 200, message: 'Home section saved successfully', insertId: result.insertId });
    });
};

// PUT /updatewebsitehomesection/:id
exports.updatewebsitehomesection = function (req, res) {
    var b = req.body;
    var id = req.params.id;
    if (!id) {
        return res.json({ status: 202, message: 'Home section ID is required' });
    }
    var QRY = "UPDATE tenant_website_home_sections SET " +
        "section_key = ?, heading = ?, subheading = ?, image = ?, display_order = ?, status = ? " +
        "WHERE id = ? AND tenant_id = ? AND IFNULL(d_in,0) = 0";
    var params = [
        b.section_key || '',
        b.heading || '',
        b.subheading || '',
        b.image || '',
        b.display_order || 1,
        b.status !== undefined ? b.status : 1,
        id,
        req.admin.tenant_id
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'updatewebsitehomesection', function (err) {
        if (err) {
            console.log('UPDATE WEBSITE HOME SECTION ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, message: 'Home section updated successfully' });
    });
};

// DELETE /deletewebsitehomesection/:id
// Hard delete - the row is removed from tenant_website_home_sections, not flagged.
exports.deletewebsitehomesection = function (req, res) {
    var id = req.params.id;
    if (!id) return res.json({ status: 202, message: 'Home section ID is required' });
    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        'DELETE FROM tenant_website_home_sections WHERE id = ? AND tenant_id = ?',
        [id, req.admin.tenant_id],
        'deletewebsitehomesection',
        function (err, result) {
            if (err) {
                console.log('DELETEWEBSITEHOMESECTION ERROR:', err);
                return res.json({ status: 500, message: 'Internal server error' });
            }
            if (!result || !result.affectedRows) {
                return res.json({ status: 202, message: 'Home section not found' });
            }
            return res.json({
                status: 200,
                message: 'Home section deleted successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};

// GET /getwebsitepromosections
exports.getwebsitepromosections = function (req, res) {
    var QRY = "SELECT id, tenant_id, title, subtitle, image, link_url, display_order, status " +
        "FROM tenant_website_promo_sections " +
        "WHERE tenant_id = ? AND IFNULL(d_in,0) = 0 " +
        "ORDER BY display_order ASC, id DESC";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.admin.tenant_id], 'getwebsitepromosections', function (err, rows) {
        if (err) {
            console.log('GET WEBSITE PROMO SECTIONS ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, data: rows || [] });
    });
};

// POST /savewebsitepromosection
exports.savewebsitepromosection = function (req, res) {
    var b = req.body;
    if (!b.title) {
        return res.json({ status: 202, message: 'Title is required' });
    }
    var QRY = "INSERT INTO tenant_website_promo_sections " +
        "(tenant_id, title, subtitle, image, link_url, display_order, status) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)";
    var params = [
        req.admin.tenant_id,
        b.title,
        b.subtitle || '',
        b.image || '',
        b.link_url || '',
        b.display_order || 1,
        b.status !== undefined ? b.status : 1
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'savewebsitepromosection', function (err, result) {
        if (err) {
            console.log('SAVE WEBSITE PROMO SECTION ERROR:', err);
            return res.json({ status: 500, message: 'Failed to save promotional section' });
        }
        return res.json({ status: 200, message: 'Promotional section saved successfully', insertId: result.insertId });
    });
};

// PUT /updatewebsitepromosection/:id
exports.updatewebsitepromosection = function (req, res) {
    var b = req.body;
    var id = req.params.id;
    if (!id) {
        return res.json({ status: 202, message: 'Promotional section ID is required' });
    }
    var QRY = "UPDATE tenant_website_promo_sections SET " +
        "title = ?, subtitle = ?, image = ?, link_url = ?, display_order = ?, status = ? " +
        "WHERE id = ? AND tenant_id = ? AND IFNULL(d_in,0) = 0";
    var params = [
        b.title || '',
        b.subtitle || '',
        b.image || '',
        b.link_url || '',
        b.display_order || 1,
        b.status !== undefined ? b.status : 1,
        id,
        req.admin.tenant_id
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'updatewebsitepromosection', function (err) {
        if (err) {
            console.log('UPDATE WEBSITE PROMO SECTION ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, message: 'Promotional section updated successfully' });
    });
};

// DELETE /deletewebsitepromosection/:id
// Hard delete - the row is removed from tenant_website_promo_sections, not flagged.
exports.deletewebsitepromosection = function (req, res) {
    var id = req.params.id;
    if (!id) return res.json({ status: 202, message: 'Promotional section ID is required' });
    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        'DELETE FROM tenant_website_promo_sections WHERE id = ? AND tenant_id = ?',
        [id, req.admin.tenant_id],
        'deletewebsitepromosection',
        function (err, result) {
            if (err) {
                console.log('DELETEWEBSITEPROMOSECTION ERROR:', err);
                return res.json({ status: 500, message: 'Internal server error' });
            }
            if (!result || !result.affectedRows) {
                return res.json({ status: 202, message: 'Promotional section not found' });
            }
            return res.json({
                status: 200,
                message: 'Promotional section deleted successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};

// GET /getwebsitetestimonials
exports.getwebsitetestimonials = function (req, res) {
    var QRY = "SELECT id, tenant_id, customer_name, designation, photo, rating, message, display_order, status " +
        "FROM tenant_website_testimonials " +
        "WHERE tenant_id = ? AND IFNULL(d_in,0) = 0 " +
        "ORDER BY display_order ASC, id DESC";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.admin.tenant_id], 'getwebsitetestimonials', function (err, rows) {
        if (err) {
            console.log('GET WEBSITE TESTIMONIALS ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, data: rows || [] });
    });
};

// POST /savewebsitetestimonial
exports.savewebsitetestimonial = function (req, res) {
    var b = req.body;
    if (!b.customer_name) {
        return res.json({ status: 202, message: 'Customer name is required' });
    }
    var QRY = "INSERT INTO tenant_website_testimonials " +
        "(tenant_id, customer_name, designation, photo, rating, message, display_order, status) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    var params = [
        req.admin.tenant_id,
        b.customer_name,
        b.designation || '',
        b.photo || '',
        b.rating !== undefined && b.rating !== null && b.rating !== '' ? b.rating : 5,
        b.message || '',
        b.display_order || 1,
        b.status !== undefined ? b.status : 1
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'savewebsitetestimonial', function (err, result) {
        if (err) {
            console.log('SAVE WEBSITE TESTIMONIAL ERROR:', err);
            return res.json({ status: 500, message: 'Failed to save testimonial' });
        }
        return res.json({ status: 200, message: 'Testimonial saved successfully', insertId: result.insertId });
    });
};

// PUT /updatewebsitetestimonial/:id
exports.updatewebsitetestimonial = function (req, res) {
    var b = req.body;
    var id = req.params.id;
    if (!id) {
        return res.json({ status: 202, message: 'Testimonial ID is required' });
    }
    var QRY = "UPDATE tenant_website_testimonials SET " +
        "customer_name = ?, designation = ?, photo = ?, rating = ?, message = ?, display_order = ?, status = ? " +
        "WHERE id = ? AND tenant_id = ? AND IFNULL(d_in,0) = 0";
    var params = [
        b.customer_name || '',
        b.designation || '',
        b.photo || '',
        b.rating !== undefined && b.rating !== null && b.rating !== '' ? b.rating : 5,
        b.message || '',
        b.display_order || 1,
        b.status !== undefined ? b.status : 1,
        id,
        req.admin.tenant_id
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'updatewebsitetestimonial', function (err) {
        if (err) {
            console.log('UPDATE WEBSITE TESTIMONIAL ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, message: 'Testimonial updated successfully' });
    });
};

// DELETE /deletewebsitetestimonial/:id
// Hard delete - the row is removed from tenant_website_testimonials, not flagged.
exports.deletewebsitetestimonial = function (req, res) {
    var id = req.params.id;
    if (!id) return res.json({ status: 202, message: 'Testimonial ID is required' });
    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        'DELETE FROM tenant_website_testimonials WHERE id = ? AND tenant_id = ?',
        [id, req.admin.tenant_id],
        'deletewebsitetestimonial',
        function (err, result) {
            if (err) {
                console.log('DELETEWEBSITETESTIMONIAL ERROR:', err);
                return res.json({ status: 500, message: 'Internal server error' });
            }
            if (!result || !result.affectedRows) {
                return res.json({ status: 202, message: 'Testimonial not found' });
            }
            return res.json({
                status: 200,
                message: 'Testimonial deleted successfully',
                affectedRows: result.affectedRows
            });
        }
    );
};

// GET /getwebsitefootersettings - one row per tenant
exports.getwebsitefootersettings = function (req, res) {
    var QRY = "SELECT * FROM tenant_website_footer_settings " +
        "WHERE tenant_id = ? AND IFNULL(d_in,0) = 0 LIMIT 1";
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [req.admin.tenant_id], 'getwebsitefootersettings', function (err, rows) {
        if (err) {
            console.log('GET WEBSITE FOOTER SETTINGS ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, data: (rows && rows[0]) || {} });
    });
};

// POST /updatewebsitefootersettings - upsert on the tenant's single row
exports.updatewebsitefootersettings = function (req, res) {
    var b = req.body;
    var QRY = "INSERT INTO tenant_website_footer_settings " +
        "(tenant_id, about_text, contact_email, contact_phone, contact_address, " +
        "facebook_url, instagram_url, twitter_url, youtube_url, linkedin_url, " +
        "playstore_url, appstore_url, copyright_text) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
        "ON DUPLICATE KEY UPDATE " +
        "about_text = VALUES(about_text), contact_email = VALUES(contact_email), " +
        "contact_phone = VALUES(contact_phone), contact_address = VALUES(contact_address), " +
        "facebook_url = VALUES(facebook_url), instagram_url = VALUES(instagram_url), " +
        "twitter_url = VALUES(twitter_url), youtube_url = VALUES(youtube_url), " +
        "linkedin_url = VALUES(linkedin_url), playstore_url = VALUES(playstore_url), " +
        "appstore_url = VALUES(appstore_url), copyright_text = VALUES(copyright_text), d_in = 0";
    var params = [
        req.admin.tenant_id,
        b.about_text || '',
        b.contact_email || '',
        b.contact_phone || '',
        b.contact_address || '',
        b.facebook_url || '',
        b.instagram_url || '',
        b.twitter_url || '',
        b.youtube_url || '',
        b.linkedin_url || '',
        b.playstore_url || '',
        b.appstore_url || '',
        b.copyright_text || ''
    ];
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'updatewebsitefootersettings', function (err) {
        if (err) {
            console.log('UPDATE WEBSITE FOOTER SETTINGS ERROR:', err);
            return res.json({ status: 500, message: 'Internal server error' });
        }
        return res.json({ status: 200, message: 'Footer settings updated successfully' });
    });
};
// Website Theme Settings - public website branding
exports.getwebsitethemesettings = function (req, res) {
    var QRY = "SELECT id, tenant_id, brand_scope, " +
        "primary_color, secondary_color, sidebar_color, header_color, button_color, " +
        "font_family, custom_css " +
        "FROM tenant_branding " +
        "WHERE tenant_id = ? AND brand_scope = 'public_app' AND IFNULL(d_in,0) = 0 " +
        "ORDER BY id DESC LIMIT 1";

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        [req.admin.tenant_id],
        'getwebsitethemesettings',
        function (err, rows) {
            if (err) {
                console.log('GET WEBSITE THEME SETTINGS ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Internal server error'
                });
            }

            return res.json({
                status: 200,
                data: (rows && rows[0]) || {}
            });
        }
    );
};

exports.updatewebsitethemesettings = function (req, res) {
    var b = req.body || {};

    var QRY = "INSERT INTO tenant_branding " +
        "(tenant_id, brand_scope, primary_color, secondary_color, sidebar_color, " +
        "header_color, button_color, font_family, custom_css, d_in) " +
        "VALUES (?, 'public_app', ?, ?, ?, ?, ?, ?, ?, 0) " +
        "ON DUPLICATE KEY UPDATE " +
        "primary_color = VALUES(primary_color), " +
        "secondary_color = VALUES(secondary_color), " +
        "sidebar_color = VALUES(sidebar_color), " +
        "header_color = VALUES(header_color), " +
        "button_color = VALUES(button_color), " +
        "font_family = VALUES(font_family), " +
        "custom_css = VALUES(custom_css), " +
        "d_in = 0";

    var params = [
        req.admin.tenant_id,
        b.primary_color || '#01003c',
        b.secondary_color || '#6c757d',
        b.sidebar_color || '#01003c',
        b.header_color || '',
        b.button_color || '',
        b.font_family || '',
        b.custom_css || ''
    ];

    dbutil.sqlinjection(
        sqldb.MySQLConPool,
        QRY,
        params,
        'updatewebsitethemesettings',
        function (err) {
            if (err) {
                console.log('UPDATE WEBSITE THEME SETTINGS ERROR:', err);
                return res.json({
                    status: 500,
                    message: 'Failed to update website theme settings'
                });
            }

            return res.json({
                status: 200,
                message: 'Website theme settings updated successfully'
            });
        }
    );
}; 


// Franchise administration: schema allowlist, action permissions and tenant-scoped CRUD.
const franchiseModel = require('../models/mainModel').franchise;
const bcrypt = require('bcryptjs');
const identity = require('../../validators/mstrVldt');

const textLimits = {
    franchise_name: 255, franchise_code: 50, owner_name: 255, mobile_number: 20, email: 255,
    territory_name: 150, city: 150, area: 150, bank_account_holder: 255, bank_account_number: 50,
    bank_ifsc_code: 20, bank_name: 150, upi_id: 100,
};

const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const validId = value => (typeof value === 'number' || typeof value === 'string') && /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647;
const status = value => value === 0 || value === 1 || value === '0' || value === '1';

function refuse(res, errors) {
    return res.json({ status: 202, message: Object.values(errors)[0], errors });
}

function unknownFields(body, allowed, errors) {
    Object.keys(body).forEach(key => { if (!allowed.includes(key)) errors[key] = 'Unsupported request field: ' + key; });
}

function validateFranchise(body, editing) {
    const errors = {}, values = {};
    unknownFields(body, [...Object.keys(textLimits), 'commission_percentage', 'pwd', 'login_status', 'active_status', ...(editing ? ['id'] : [])], errors);
    for (const [key, limit] of Object.entries(textLimits)) {
        if (!own(body, key)) continue;
        const value = body[key];
        if (value !== null && typeof value !== 'string') { errors[key] = key + ' must be text.'; continue; }
        const clean = value === null ? null : value.trim();
        if (clean && (clean.length > limit || /[\x00-\x1f\x7f]/.test(clean))) { errors[key] = key + ' is invalid or too long.'; continue; }
        values[key] = clean || null;
    }
    for (const key of ['franchise_name', 'mobile_number']) {
        if ((!editing || own(body, key)) && !values[key]) errors[key] = key + ' is required.';
    }
    if (values.mobile_number && !/^\d{10}$/.test(values.mobile_number)) errors.mobile_number = 'Enter a 10-digit mobile number.';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.';
    if (values.bank_ifsc_code) {
        values.bank_ifsc_code = values.bank_ifsc_code.toUpperCase();
        if (!identity.identityPatterns.ifsc.test(values.bank_ifsc_code)) errors.bank_ifsc_code = 'Enter a valid 11-character IFSC code.';
    }
    if (values.bank_account_number && !identity.identityPatterns.account.test(values.bank_account_number)) errors.bank_account_number = 'Enter an account number containing 9 to 18 digits.';
    if (own(body, 'commission_percentage')) {
        const value = body.commission_percentage;
        if (!['number', 'string'].includes(typeof value) || !/^\d+(?:\.\d{1,2})?$/.test(String(value)) || Number(value) > 100) errors.commission_percentage = 'Commission must be between 0 and 100 with at most two decimal places.';
        else values.commission_percentage = Number(value);
    }
    for (const key of ['login_status', 'active_status']) {
        if (own(body, key)) {
            if (!status(body[key])) errors[key] = key + ' must be 0 or 1.';
            else values[key] = Number(body[key]);
        }
    }
    if (!editing && !own(body, 'pwd')) errors.pwd = 'Password is required.';
    if (own(body, 'pwd')) {
        if (typeof body.pwd !== 'string') errors.pwd = 'Password must be text.';
        else if (body.pwd.trim()) {
            if (body.pwd.length < 6 || Buffer.byteLength(body.pwd, 'utf8') > 72) errors.pwd = 'Password must contain at least 6 characters and at most 72 UTF-8 bytes.';
            else values.pwd = body.pwd;
        } else if (!editing) errors.pwd = 'Password is required.';
    }
    return { errors, values };
}

// ==========================================
// EXPORTED ROUTE HANDLERS (NO IIFE WRAPPER)
// ==========================================

exports.getfranchises = async (req, res) => {
    try {
        const rows = await franchiseModel.list(req.admin.tenant_id);
        const data = rows.map(row => Object.fromEntries(franchiseModel.fields.map(key => [key, row[key]])));
        return res.json({ status: 200, data });
    } catch (error) {
        console.error("getfranchises error:", error);
        return res.json({ status: 500, message: 'Internal server error' });
    }
};

exports.addfranchise = async (req, res) => {
    try {
        const { errors, values } = validateFranchise(req.body || {}, false);
        if (Object.keys(errors).length) return refuse(res, errors);
        
        if (await franchiseModel.duplicateMobile(values.mobile_number)) {
            return refuse(res, { mobile_number: 'Mobile number is already registered.' });
        }
        
        values.pwd = await bcrypt.hash(values.pwd, 12);
        const result = await franchiseModel.create(req.admin.tenant_id, values);
        return res.json({ status: 200, message: 'Franchise added successfully', id: result.insertId });
    } catch (error) {
        console.error("addfranchise error:", error);
        return res.json({ status: 500, message: 'Internal server error' });
    }
};

exports.updatefranchise = async (req, res) => {
    try {
        const body = req.body || {};
        if (!validId(body.id)) return refuse(res, { id: 'A valid franchise ID is required.' });
        
        const { errors, values } = validateFranchise(body, true);
        if (Object.keys(errors).length) return refuse(res, errors);
        
        if (!await franchiseModel.find(Number(body.id), req.admin.tenant_id)) return refuse(res, { id: 'Franchise not found.' });
        if (!Object.keys(values).length) return refuse(res, { id: 'No fields to update.' });
        
        if (values.mobile_number && await franchiseModel.duplicateMobile(values.mobile_number, Number(body.id))) {
            return refuse(res, { mobile_number: 'Mobile number is already registered.' });
        }
        
        if (own(values, 'pwd')) values.pwd = await bcrypt.hash(values.pwd, 12);
        
        const result = await franchiseModel.update(Number(body.id), req.admin.tenant_id, values);
        if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
        
        return res.json({ status: 200, message: 'Franchise updated successfully' });
    } catch (error) {
        console.error("updatefranchise error:", error);
        return res.json({ status: 500, message: 'Internal server error' });
    }
};

exports.deletefranchise = async (req, res) => {
    try {
        const body = req.body || {}, errors = {};
        unknownFields(body, ['id'], errors);
        if (!validId(body.id)) errors.id = 'A valid franchise ID is required.';
        if (Object.keys(errors).length) return refuse(res, errors);
        
        const result = await franchiseModel.update(Number(body.id), req.admin.tenant_id, { d_in: 1 });
        if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
        
        return res.json({ status: 200, message: 'Franchise deleted successfully' });
    } catch (error) {
        console.error("deletefranchise error:", error);
        return res.json({ status: 500, message: 'Internal server error' });
    }
};

function updateFranchiseStatus(field) {
    return async (req, res) => {
        try {
            const body = req.body || {}, errors = {};
            unknownFields(body, ['id', 'value'], errors);
            if (!validId(body.id)) errors.id = 'A valid franchise ID is required.';
            if (!status(body.value)) errors.value = 'Status must be 0 or 1.';
            if (Object.keys(errors).length) return refuse(res, errors);
            
            const result = await franchiseModel.update(Number(body.id), req.admin.tenant_id, { [field]: Number(body.value) });
            if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
            
            return res.json({ status: 200, message: 'Franchise status updated successfully' });
        } catch (error) {
            console.error("update franchise status error:", error);
            return res.json({ status: 500, message: 'Internal server error' });
        }
    };
}

exports.updatefranchiseloginstatus = updateFranchiseStatus('login_status');
exports.updatefranchiseactivestatus = updateFranchiseStatus('active_status');