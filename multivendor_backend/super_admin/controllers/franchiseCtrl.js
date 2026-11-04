var sqldb = require('../../config/dbconnect');
var dbutil = require('../../utils/dbutils');
var bcrypt = require('bcryptjs');

var TEXT_LIMITS = {
    franchise_name: 255, franchise_code: 50, owner_name: 255, mobile_number: 20, email: 255,
    territory_name: 150, city: 150, area: 150, bank_account_holder: 255, bank_account_number: 50,
    bank_ifsc_code: 20, bank_name: 150, upi_id: 100
};
var SELECT_FIELDS = [
    'f.id', 'f.tenant_id', 't.tenant_name', 'f.franchise_name', 'f.franchise_code', 'f.owner_name',
    'f.mobile_number', 'f.email', 'f.territory_name', 'f.city', 'f.area', 'f.commission_percentage',
    'f.bank_account_holder', 'f.bank_account_number', 'f.bank_ifsc_code', 'f.bank_name', 'f.upi_id',
    'f.login_status', 'f.active_status', 'f.i_ts'
].join(', ');

function query(sql, params, label) {
    return new Promise(function (resolve, reject) {
        dbutil.sqlinjection(sqldb.MySQLConPool, sql, params || [], label, function (err, rows) {
            if (err) reject(err); else resolve(rows);
        });
    });
}

function fail(message) {
    var error = new Error(message);
    error.userMessage = message;
    return error;
}

function handle(label, fn) {
    return function (req, res) {
        Promise.resolve().then(function () { return fn(req, res); }).catch(function (error) {
            if (error && error.userMessage) return res.json({ status: 202, message: error.userMessage });
            console.error('[super_admin/' + label + ']', error && (error.code || error.message || error));
            return res.json({ status: 500, message: 'Internal server error' });
        });
    };
}

function validId(value) {
    return (typeof value === 'number' || typeof value === 'string') &&
        /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
}

function validate(body, editing) {
    var errors = {};
    var values = {};
    var allowed = Object.keys(TEXT_LIMITS).concat(['commission_percentage', 'login_status', 'active_status']);
    if (!editing) allowed.push('tenant_id', 'pwd');
    else allowed.push('id', 'pwd');

    Object.keys(body).forEach(function (key) {
        if (allowed.indexOf(key) === -1) errors[key] = 'Unsupported request field: ' + key;
    });

    Object.keys(TEXT_LIMITS).forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(body, key)) return;
        var value = body[key];
        if (value !== null && typeof value !== 'string') {
            errors[key] = key + ' must be text.';
            return;
        }
        var clean = value === null ? null : value.trim();
        if (clean && (clean.length > TEXT_LIMITS[key] || /[\x00-\x1f\x7f]/.test(clean))) {
            errors[key] = key + ' is invalid or too long.';
            return;
        }
        values[key] = clean || null;
    });

    if ((!editing || Object.prototype.hasOwnProperty.call(body, 'franchise_name')) && !values.franchise_name) {
        errors.franchise_name = 'Franchise name is required.';
    }
    if ((!editing || Object.prototype.hasOwnProperty.call(body, 'mobile_number')) && !values.mobile_number) {
        errors.mobile_number = 'Mobile number is required.';
    }
    if (values.mobile_number && !/^\d{10}$/.test(values.mobile_number)) {
        errors.mobile_number = 'Enter a 10-digit mobile number.';
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Enter a valid email address.';
    }
    if (Object.prototype.hasOwnProperty.call(body, 'commission_percentage')) {
        var commission = body.commission_percentage;
        if (!['number', 'string'].includes(typeof commission) ||
            !/^\d+(?:\.\d{1,2})?$/.test(String(commission)) || Number(commission) > 100) {
            errors.commission_percentage = 'Commission must be between 0 and 100 with at most two decimal places.';
        } else values.commission_percentage = Number(commission);
    }
    ['login_status', 'active_status'].forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(body, key)) return;
        if (![0, 1, '0', '1'].includes(body[key])) errors[key] = key + ' must be 0 or 1.';
        else values[key] = Number(body[key]);
    });
    if (!editing && !validId(body.tenant_id)) errors.tenant_id = 'A valid tenant ID is required.';
    if (!editing && (typeof body.pwd !== 'string' || body.pwd.trim().length < 6 ||
        Buffer.byteLength(body.pwd, 'utf8') > 72)) {
        errors.pwd = 'Password must contain at least 6 characters and at most 72 UTF-8 bytes.';
    } else if (editing && Object.prototype.hasOwnProperty.call(body, 'pwd') && body.pwd !== '') {
        if (typeof body.pwd !== 'string' || body.pwd.trim().length < 6 || Buffer.byteLength(body.pwd, 'utf8') > 72) {
            errors.pwd = 'Password must contain at least 6 characters and at most 72 UTF-8 bytes.';
        } else values.pwd = body.pwd;
    }

    return { errors: errors, values: values };
}

function refuse(res, errors) {
    return res.json({ status: 202, message: Object.values(errors)[0], errors: errors });
}

async function ensureUniqueMobile(mobile, id) {
    var rows = await query(
        'SELECT id FROM franchises WHERE mobile_number = ? AND IFNULL(d_in,0) = 0 AND id <> ? LIMIT 1',
        [mobile, id || 0],
        'franchise-mobile-check'
    );
    return rows.length === 0;
}

exports.getfranchises = handle('getfranchises', async function (req, res) {
    var rows = await query(
        'SELECT ' + SELECT_FIELDS + ' FROM franchises f LEFT JOIN tenants t ON t.id = f.tenant_id ' +
        'WHERE IFNULL(f.d_in,0) = 0 ORDER BY f.id DESC',
        [],
        'getfranchises'
    );
    return res.json({ status: 200, data: rows });
});

exports.addfranchise = handle('addfranchise', async function (req, res) {
    var body = req.body || {};
    var result = validate(body, false);
    if (Object.keys(result.errors).length) return refuse(res, result.errors);

    var tenant = await query('SELECT id FROM tenants WHERE id = ? AND IFNULL(d_in,0) = 0', [Number(body.tenant_id)], 'franchise-tenant-check');
    if (!tenant.length) return refuse(res, { tenant_id: 'Tenant not found.' });
    if (!await ensureUniqueMobile(result.values.mobile_number)) {
        return refuse(res, { mobile_number: 'Mobile number is already registered.' });
    }

    result.values.pwd = await bcrypt.hash(body.pwd, 12);
    var keys = Object.keys(result.values);
    var inserted = await query(
        'INSERT INTO franchises (tenant_id, ' + keys.join(', ') + ') VALUES (?, ' + keys.map(function () { return '?'; }).join(', ') + ')',
        [Number(body.tenant_id)].concat(keys.map(function (key) { return result.values[key]; })),
        'addfranchise'
    );
    return res.json({ status: 200, message: 'Franchise added successfully', id: inserted.insertId });
});

exports.updatefranchise = handle('updatefranchise', async function (req, res) {
    var body = req.body || {};
    if (!validId(body.id)) return refuse(res, { id: 'A valid franchise ID is required.' });
    var result = validate(body, true);
    if (Object.keys(result.errors).length) return refuse(res, result.errors);
    if (!Object.keys(result.values).length) return refuse(res, { id: 'No fields to update.' });
    var existing = await query('SELECT id FROM franchises WHERE id = ? AND IFNULL(d_in,0) = 0', [Number(body.id)], 'updatefranchise-find');
    if (!existing.length) return refuse(res, { id: 'Franchise not found.' });
    if (result.values.mobile_number && !await ensureUniqueMobile(result.values.mobile_number, Number(body.id))) {
        return refuse(res, { mobile_number: 'Mobile number is already registered.' });
    }
    if (result.values.pwd) result.values.pwd = await bcrypt.hash(result.values.pwd, 12);
    var keys = Object.keys(result.values);
    await query(
        'UPDATE franchises SET ' + keys.map(function (key) { return key + ' = ?'; }).join(', ') +
        ' WHERE id = ? AND IFNULL(d_in,0) = 0',
        keys.map(function (key) { return result.values[key]; }).concat([Number(body.id)]),
        'updatefranchise'
    );
    return res.json({ status: 200, message: 'Franchise updated successfully' });
});

exports.deletefranchise = handle('deletefranchise', async function (req, res) {
    var id = req.body && req.body.id;
    if (!validId(id)) return refuse(res, { id: 'A valid franchise ID is required.' });
    var result = await query('UPDATE franchises SET d_in = 1 WHERE id = ? AND IFNULL(d_in,0) = 0', [Number(id)], 'deletefranchise');
    if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
    return res.json({ status: 200, message: 'Franchise deleted successfully' });
});

function updateStatus(field) {
    return handle('updatefranchisestatus', async function (req, res) {
        var body = req.body || {};
        if (!validId(body.id)) return refuse(res, { id: 'A valid franchise ID is required.' });
        if (![0, 1, '0', '1'].includes(body.value)) return refuse(res, { value: 'Status must be 0 or 1.' });
        var result = await query(
            'UPDATE franchises SET ' + field + ' = ? WHERE id = ? AND IFNULL(d_in,0) = 0',
            [Number(body.value), Number(body.id)],
            'updatefranchisestatus'
        );
        if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
        return res.json({ status: 200, message: 'Franchise status updated successfully' });
    });
}

exports.updatefranchiseloginstatus = updateStatus('login_status');
exports.updatefranchiseactivestatus = updateStatus('active_status');
