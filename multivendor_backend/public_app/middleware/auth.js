const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const { fail } = require('../lib/core');
const secret = () => process.env.MV_PUBLIC_JWT_SECRET || process.env.MV_JWT_SECRET || 'mv-public-dev-secret';
exports.sign = payload => jwt.sign(payload, secret(), { expiresIn: '30d' });
exports.optional = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        if (!header) return next();
        const parts = header.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') fail(401, 'INVALID_TOKEN', 'Authorization token is invalid.');
        const decoded = jwt.verify(parts[1], secret());
        const customer = await db.one('SELECT id, tenant_id, customer_name, mobile_number, email, gender, active_status FROM customers WHERE id=? AND tenant_id=? AND d_in=0', [decoded.customerId, decoded.tenantId]);
        if (!customer || Number(customer.active_status) !== 1) fail(401, 'SESSION_EXPIRED', 'Please sign in again.');
        req.customer = customer; next();
    } catch (error) { next(error); }
};
exports.required = async (req, res, next) => {
    await exports.optional(req, res, error => error ? next(error) : req.customer ? next() : next(Object.assign(new Error('Sign in required.'), { status: 401, code: 'AUTH_REQUIRED' })));
};
