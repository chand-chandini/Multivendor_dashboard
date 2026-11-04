// Partner App - JWT auth for vendors and delivery partners.
// Tokens carry { ref_id, role, tenant_id, mobile }; role is 'vendor' or 'delivery'.

var jwt = require('jsonwebtoken');

var TOKEN_EXPIRY = '7d';

// Read at call time: config/dbconnect loads .env when it is first required.
function secret() {
    return process.env.MV_JWT_SECRET || 'mv-partner-dev-secret';
}

function sign(payload) {
    return jwt.sign(payload, secret(), { expiresIn: TOKEN_EXPIRY });
}

function requireAuth(role) {
    return function (req, res, next) {
        var header = req.headers['authorization'] || '';
        var parts = header.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ status: 401, message: 'Authorization header missing' });
        }
        jwt.verify(parts[1], secret(), function (err, decoded) {
            if (err) return res.status(401).json({ status: 401, message: 'Invalid or expired token' });
            if (role && decoded.role !== role) {
                return res.status(401).json({ status: 401, message: 'This action needs the ' + role + ' workspace' });
            }
            req.partner = {
                id: decoded.ref_id,
                role: decoded.role,
                tenant_id: decoded.tenant_id,
                mobile: decoded.mobile
            };
            next();
        });
    };
}

module.exports = { sign: sign, requireAuth: requireAuth };
