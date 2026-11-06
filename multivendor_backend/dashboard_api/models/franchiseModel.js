// Franchise admin persistence. Reuse the existing parameterized DB helper.
const db = require('../../public_app/lib/db');
const ROUTE_PATH = '/masters/franchise/franchise-list';

// UPDATED: Removed old columns, added new image and number columns
const fields = ['id', 'tenant_id', 'franchise_name', 'mobile_number', 'email',
    'location', 'area', 'aadhar_number', 'pan_number', 
    'bank_account_number', 'bank_image', 'aadhar_image', 'pan_image', 
    'login_status', 'active_status','pwd', 'i_ts'];

exports.fields = fields;

exports.permitted = async function (admin, action) {
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

exports.list = tenant => db.query('SELECT ' + fields.join(', ') + ' FROM franchises WHERE tenant_id = ? AND d_in = 0 ORDER BY id DESC', [tenant]);

exports.find = (id, tenant) => db.one('SELECT id FROM franchises WHERE id = ? AND tenant_id = ? AND d_in = 0', [id, tenant]);

// Partner login resolves a mobile globally (no tenant selector). Do not create an ambiguous login.
exports.duplicateMobile = (mobile, id) => db.one('SELECT id FROM franchises WHERE mobile_number = ? AND d_in = 0 AND id <> ? LIMIT 1', [mobile, id || 0]);

exports.create = function (tenant, values) {
    const keys = Object.keys(values);
    return db.query('INSERT INTO franchises (tenant_id, ' + keys.join(', ') + ') VALUES (?, ' + keys.map(() => '?').join(', ') + ')', [tenant, ...keys.map(key => values[key])]);
};

exports.update = function (id, tenant, values) {
    const keys = Object.keys(values);
    return db.query('UPDATE franchises SET ' + keys.map(key => key + ' = ?').join(', ') + ' WHERE id = ? AND tenant_id = ? AND d_in = 0', [...keys.map(key => values[key]), id, tenant]);
};