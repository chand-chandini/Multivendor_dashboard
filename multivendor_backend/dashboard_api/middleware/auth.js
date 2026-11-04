var jwt = require('jsonwebtoken');

var JWT_SECRET = process.env.MV_ADMIN_JWT_SECRET || 'mv-admin-dev-secret';

module.exports = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ status: 401, message: 'Authorization header missing' });
    }

    var parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ status: 401, message: 'Invalid authorization format' });
    }

    var token = parts[1];
    jwt.verify(token, JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).json({ status: 401, message: 'Invalid or expired token' });
        }
        req.admin = {
            id: decoded.admin_id,
            tenant_id: decoded.tenant_id,
            mobile: decoded.mobile,
            admin_type: decoded.admin_type
        };
        next();
    });
};
