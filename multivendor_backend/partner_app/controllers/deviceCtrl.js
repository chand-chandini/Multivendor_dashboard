// Partner App - device registration for push notifications.
// The app calls these right after sign-in, on token refresh, and on sign-out.

var db = require('../lib/db');
var devices = require('../lib/devices');
var push = require('../lib/push');

// POST /registerdevice { token, device_type?, app_version? }
exports.registerdevice = db.handle(async function (req, res) {
    var ok = await devices.register(
        devices.refTypeFor(req.partner.role),
        req.partner.id,
        req.partner.tenant_id,
        req.body.token,
        { deviceType: req.body.device_type, appVersion: req.body.app_version });
    if (!ok) return db.refuse(res, 'That device token could not be registered.');
    // The app uses this to decide whether to lean on polling alone.
    return res.json({ status: 200, message: 'Device registered', push_enabled: push.isConfigured() });
});

// POST /unregisterdevice { token }
exports.unregisterdevice = db.handle(async function (req, res) {
    await devices.unregister(req.body.token);
    return res.json({ status: 200, message: 'Device removed' });
});
