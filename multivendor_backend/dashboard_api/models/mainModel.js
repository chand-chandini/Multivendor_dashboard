// Dashboard API - Main Model
// Placeholder for future model logic (validation, transformation, etc.)

module.exports = {};

// Franchise queries use the existing pool through the existing parameterized helper.
module.exports.franchise = (function () {
const franchise = {};
// Franchise admin persistence. Reuse the existing parameterized DB helper.
const db = require('../../public_app/lib/db');
const ROUTE_PATH = '/masters/franchise/franchise-list';

// UPDATED: Removed old columns, added new image and number columns
const fields = ['id', 'tenant_id', 'franchise_name', 'mobile_number', 'email',
    'location', 'area', 'aadhar_number', 'pan_number', 
    'bank_account_number', 'bank_image', 'aadhar_image', 'pan_image', 
    'login_status', 'active_status','pwd', 'i_ts'];

franchise.fields = fields;
// Register the catalog in the database used by this backend, not a frontend menu overlay.
// No permission assignments are created.
franchise.ensureCatalog = function () {
    return db.transaction(async function (query) {
        // Lock the existing catalog in a stable order so simultaneous requests cannot
        // allocate duplicate modules. IDs are always supplied by AUTO_INCREMENT.
        const modules = await query('SELECT id, module_name, module_order, is_active, d_in FROM admin_main_module ORDER BY id FOR UPDATE');
        const matches = modules.filter(row => row.module_name === 'Franchise');
        if (matches.length > 1) throw new Error('Ambiguous Franchise module catalog');
        let parent = matches[0];
        if (!parent) {
            const order = modules.reduce((max, row) => Math.max(max, Number(row.module_order) || 0), 0) + 1;
            const result = await query('INSERT INTO admin_main_module (module_name, module_icon, module_order, is_active, d_in) VALUES (?, ?, ?, 1, 0)', ['Franchise', 'ri-store-2-line', order]);
            parent = { id: result.insertId, is_active: 1, d_in: 0 };
        } else if (Number(parent.is_active) !== 1 || Number(parent.d_in || 0) !== 0) {
            await query('UPDATE admin_main_module SET is_active = 1, d_in = 0 WHERE id = ?', [parent.id]);
            parent.is_active = 1;
            parent.d_in = 0;
        }
        const children = await query('SELECT id, admin_main_module_id, sub_module_name, route_path, is_active, d_in FROM admin_sub_module WHERE route_path = ? OR (admin_main_module_id = ? AND sub_module_name = ?) FOR UPDATE', [ROUTE_PATH, parent.id, 'Franchise List']);
        if (children.length > 1 || children.some(row => row.admin_main_module_id !== parent.id || row.route_path !== ROUTE_PATH || row.sub_module_name !== 'Franchise List')) {
            throw new Error('Conflicting Franchise sub-module catalog');
        }
        let child = children[0];
        if (!child) {
            const result = await query('INSERT INTO admin_sub_module (admin_main_module_id, sub_module_name, route_path, sub_module_order, is_active, d_in) VALUES (?, ?, ?, 1, 1, 0)', [parent.id, 'Franchise List', ROUTE_PATH]);
            child = { id: result.insertId };
        } else if (Number(child.is_active) !== 1 || Number(child.d_in || 0) !== 0) {
            await query('UPDATE admin_sub_module SET is_active = 1, d_in = 0 WHERE id = ?', [child.id]);
        }
        return { module_id: parent.id, sub_module_id: child.id };
    });
};

franchise.permitted = async function (admin, action) {
    const flag = { view: 'can_view', add: 'can_add', edit: 'can_edit', delete: 'can_delete' }[action];
    if (!flag) return false;
    const row = await db.one(
        'SELECT p.id FROM admin_user_permissions p ' +
        'JOIN admin_users_t a ON a.id = p.admin_users_t_id ' +
        'JOIN admin_main_module m ON m.id = p.admin_main_module_id ' +
        'JOIN admin_sub_module s ON s.id = p.admin_sub_module_id AND s.admin_main_module_id = m.id ' +
        'WHERE a.id = ? AND a.tenant_id = ? AND a.d_in = 0 AND a.login_status = 0 ' +
        'AND IFNULL(p.d_in,0) = 0 AND m.is_active = 1 AND IFNULL(m.d_in,0) = 0 ' +
        'AND s.is_active = 1 AND IFNULL(s.d_in,0) = 0 AND s.route_path = ? ' +
        'AND p.can_view = 1 AND p.' + flag + ' = 1 LIMIT 1',
        [admin.id, admin.tenant_id, ROUTE_PATH]);
    return !!row;
};

// This now uses the updated `fields` array above
franchise.list = tenant => db.query('SELECT ' + fields.join(', ') + ' FROM franchises WHERE tenant_id = ? AND d_in = 0 ORDER BY id DESC', [tenant]);

franchise.find = (id, tenant) => db.one('SELECT id FROM franchises WHERE id = ? AND tenant_id = ? AND d_in = 0', [id, tenant]);

// Partner login resolves a mobile globally (no tenant selector). Do not create an ambiguous login.
franchise.duplicateMobile = (mobile, id) => db.one('SELECT id FROM franchises WHERE mobile_number = ? AND d_in = 0 AND id <> ? LIMIT 1', [mobile, id || 0]);

franchise.create = function (tenant, values) {
    const keys = Object.keys(values);
    return db.query('INSERT INTO franchises (tenant_id, ' + keys.join(', ') + ') VALUES (?, ' + keys.map(() => '?').join(', ') + ')', [tenant, ...keys.map(key => values[key])]);
};

franchise.update = function (id, tenant, values) {
    const keys = Object.keys(values);
    return db.query('UPDATE franchises SET ' + keys.map(key => key + ' = ?').join(', ') + ' WHERE id = ? AND tenant_id = ? AND d_in = 0', [...keys.map(key => values[key]), id, tenant]);
};

return franchise;
})();