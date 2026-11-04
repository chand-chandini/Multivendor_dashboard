const model = require('../models/franchiseModel');
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
function validate(body, editing) {
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
            // bcrypt uses at most 72 UTF-8 bytes. Never silently truncate credentials.
            if (body.pwd.length < 6 || Buffer.byteLength(body.pwd, 'utf8') > 72) errors.pwd = 'Password must contain at least 6 characters and at most 72 UTF-8 bytes.';
            else values.pwd = body.pwd;
        } else if (!editing) errors.pwd = 'Password is required.';
    }
    return { errors, values };
}
function protect(action, handler) {
    return async function (req, res) {
        try {
            if (!req.admin || !validId(req.admin.id) || !validId(req.admin.tenant_id)) return res.status(401).json({ status: 401, message: 'Invalid admin context' });
            if (!await model.permitted(req.admin, action)) return res.status(403).json({ status: 403, message: 'Franchise permission denied' });
            return await handler(req, res);
        } catch (error) {
            // Do not log DB exceptions: SQL diagnostics can contain password hashes.
            return res.json({ status: 500, message: 'Internal server error' });
        }
    };
}
exports.getfranchises = protect('view', async (req, res) => {
    const rows = await model.list(req.admin.tenant_id);
    // Explicit allowlist also prevents accidental credential disclosure if persistence changes.
    const data = rows.map(row => Object.fromEntries(model.fields.map(key => [key, row[key]])));
    return res.json({ status: 200, data });
});
exports.addfranchise = protect('add', async (req, res) => {
    const { errors, values } = validate(req.body || {}, false);
    if (Object.keys(errors).length) return refuse(res, errors);
    if ((own(values, 'login_status') || own(values, 'active_status')) && !await model.permitted(req.admin, 'edit')) return res.status(403).json({ status: 403, message: 'Editing status requires edit permission' });
    if (await model.duplicateMobile(values.mobile_number)) return refuse(res, { mobile_number: 'Mobile number is already registered.' });
    values.pwd = await bcrypt.hash(values.pwd, 12);
    const result = await model.create(req.admin.tenant_id, values);
    return res.json({ status: 200, message: 'Franchise added successfully', id: result.insertId });
});
exports.updatefranchise = protect('edit', async (req, res) => {
    const body = req.body || {};
    if (!validId(body.id)) return refuse(res, { id: 'A valid franchise ID is required.' });
    const { errors, values } = validate(body, true);
    if (Object.keys(errors).length) return refuse(res, errors);
    if (!await model.find(Number(body.id), req.admin.tenant_id)) return refuse(res, { id: 'Franchise not found.' });
    if (!Object.keys(values).length) return refuse(res, { id: 'No fields to update.' });
    if (values.mobile_number && await model.duplicateMobile(values.mobile_number, Number(body.id))) return refuse(res, { mobile_number: 'Mobile number is already registered.' });
    if (own(values, 'pwd')) values.pwd = await bcrypt.hash(values.pwd, 12);
    const result = await model.update(Number(body.id), req.admin.tenant_id, values);
    if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
    return res.json({ status: 200, message: 'Franchise updated successfully' });
});
exports.deletefranchise = protect('delete', async (req, res) => {
    const body = req.body || {}, errors = {};
    unknownFields(body, ['id'], errors);
    if (!validId(body.id)) errors.id = 'A valid franchise ID is required.';
    if (Object.keys(errors).length) return refuse(res, errors);
    const result = await model.update(Number(body.id), req.admin.tenant_id, { d_in: 1 });
    if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
    return res.json({ status: 200, message: 'Franchise deleted successfully' });
});
function updateStatus(field) {
    return protect('edit', async (req, res) => {
        const body = req.body || {}, errors = {};
        unknownFields(body, ['id', 'value'], errors);
        if (!validId(body.id)) errors.id = 'A valid franchise ID is required.';
        if (!status(body.value)) errors.value = 'Status must be 0 or 1.';
        if (Object.keys(errors).length) return refuse(res, errors);
        const result = await model.update(Number(body.id), req.admin.tenant_id, { [field]: Number(body.value) });
        if (!result.affectedRows) return refuse(res, { id: 'Franchise not found.' });
        return res.json({ status: 200, message: 'Franchise status updated successfully' });
    });
}
// login_status: 0 allowed, 1 blocked. active_status is independent.
exports.updatefranchiseloginstatus = updateStatus('login_status');
exports.updatefranchiseactivestatus = updateStatus('active_status');
