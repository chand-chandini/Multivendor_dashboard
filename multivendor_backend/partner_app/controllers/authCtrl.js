// Partner App - authentication for vendors and delivery partners.
// One mobile number can hold both roles (a vendors row and a delivery_partners
// row); the app picks the workspace at sign-in and can switch later.

var db = require('../lib/db');
var fmt = require('../lib/format');
var auth = require('../middleware/auth');
var branding = require('../lib/branding');

var OTP_MINUTES = 5;
var BLOCKED = 'Your account is blocked. Contact your store admin.';

function cleanMobile(value) {
    return String(value || '').replace(/\D/g, '').slice(-10);
}

async function findAccounts(mobile) {
    var vendor = await db.one(
        'SELECT v.id, v.tenant_id, v.vendor_name, v.pwd, v.login_status, l.area AS location_area, v.vendor_address ' +
        'FROM vendors v LEFT JOIN locations l ON l.id = v.location_id ' +
        'WHERE v.vendor_mobile_number = ? AND v.d_in = 0 AND v.active_status = 1 ORDER BY v.id LIMIT 1',
        [mobile], 'auth-find-vendor');
    var partner = await db.one(
        'SELECT dp.id, dp.tenant_id, dp.name, dp.pwd, dp.login_status, dp.zone_name, l.city AS location_city, l.area AS location_area ' +
        'FROM delivery_partners dp LEFT JOIN locations l ON l.id = dp.location_id ' +
        'WHERE dp.mobile_number = ? AND dp.d_in = 0 AND dp.active_status = 1 ORDER BY dp.id LIMIT 1',
        [mobile], 'auth-find-partner');
    var franchise = await db.one(
        'SELECT f.id, f.tenant_id, f.franchise_name, f.owner_name, f.pwd, f.login_status, f.territory_name, f.city, f.area ' +
        'FROM franchises f WHERE f.mobile_number = ? AND f.d_in = 0 AND f.active_status = 1 ORDER BY f.id LIMIT 1',
        [mobile], 'auth-find-franchise');
    return { vendor: vendor, partner: partner, franchise: franchise };
}

function accountJson(mobile, found) {
    var roles = [];
    if (found.vendor) roles.push('vendor');
    if (found.partner) roles.push('delivery');
    if (found.franchise) roles.push('franchise');
    return {
        mobile: mobile,
        roles: roles,
        vendor: found.vendor ? {
            storeName: found.vendor.vendor_name,
            area: found.vendor.location_area || fmt.areaFrom(found.vendor.vendor_address)
        } : undefined,
        partner: found.partner ? {
            name: found.partner.name,
            zone: [found.partner.zone_name, [found.partner.location_area, found.partner.location_city].filter(Boolean).join(', ')]
                .filter(Boolean).join(' · ')
        } : undefined,
        franchise: found.franchise ? {
            name: found.franchise.franchise_name,
            owner: found.franchise.owner_name,
            area: [found.franchise.territory_name, [found.franchise.area, found.franchise.city].filter(Boolean).join(', ')]
                .filter(Boolean).join(' · ')
        } : undefined
    };
}

/**
 * The admin dashboard stores passwords as entered (plain text). Hashed values
 * (bcrypt "$2…") are accepted too if bcryptjs is installed, so hashing can be
 * introduced later without changing the app.
 * TODO(security): move both the admin API and this check to hashed passwords.
 */
function passwordMatches(stored, given) {
    var s = String(stored || '');
    if (!s) return false;
    if (/^\$2[aby]\$/.test(s)) {
        try { return require('bcryptjs').compareSync(String(given), s); } catch (e) { return false; }
    }
    return s === String(given);
}

function tokenFor(role, row, mobile) {
    return auth.sign({ ref_id: row.id, role: role, tenant_id: row.tenant_id, mobile: mobile });
}

function roleRow(found, role) {
    if (role === 'franchise') return found.franchise;
    return role === 'vendor' ? found.vendor : found.partner;
}

var ROLES = ['vendor', 'delivery', 'franchise'];
var ROLE_NAME = { vendor: 'a vendor', delivery: 'a delivery partner', franchise: 'a franchise' };

// POST /login { mobile, password, role }
exports.login = db.handle(async function (req, res) {
    var mobile = cleanMobile(req.body.mobile);
    var role = req.body.role;
    if (mobile.length !== 10 || !req.body.password || ROLES.indexOf(role) < 0) {
        return db.refuse(res, 'Mobile number, password and workspace are required');
    }
    var found = await findAccounts(mobile);
    if (!found.vendor && !found.partner && !found.franchise) return db.refuse(res, "This number isn't registered. Contact your store admin.");
    var row = roleRow(found, role);
    if (!row) return db.refuse(res, "This number isn't registered as " + ROLE_NAME[role] + '. Choose the other workspace.');
    if (Number(row.login_status) === 1) return db.refuse(res, BLOCKED);
    if (!passwordMatches(row.pwd, req.body.password)) return db.refuse(res, 'Incorrect password. Try again or use OTP.');

    return res.json({
        status: 200,
        token: tokenFor(role, row, mobile),
        role: role,
        account: accountJson(mobile, found),
        branding: await branding.load(row.tenant_id)
    });
});

// POST /sendotp { mobile, role?, purpose: 'login' | 'password_reset' }
exports.sendotp = db.handle(async function (req, res) {
    var mobile = cleanMobile(req.body.mobile);
    var purpose = req.body.purpose === 'password_reset' ? 'password_reset' : 'login';
    var role = req.body.role;
    if (mobile.length !== 10) return db.refuse(res, 'Enter your 10-digit mobile number.');

    var found = await findAccounts(mobile);
    var row = purpose === 'login' ? roleRow(found, role) : (found.vendor || found.partner || found.franchise);
    if (!found.vendor && !found.partner && !found.franchise) return db.refuse(res, "This number isn't registered. Contact your store admin.");
    if (!row) return db.refuse(res, "This number isn't registered as " + ROLE_NAME[role] + '. Choose the other workspace.');
    if (Number(row.login_status) === 1) return db.refuse(res, BLOCKED);

    var isDemo = process.env.MV_DEMO_MOBILE && cleanMobile(process.env.MV_DEMO_MOBILE) === mobile && process.env.MV_DEMO_OTP;
    var code = isDemo ? String(process.env.MV_DEMO_OTP) : fmt.randomCode(6);
    var refType = row === found.vendor ? 'vendor' : row === found.franchise ? 'franchise' : 'delivery_partner';

    await db.query('UPDATE otp_verifications SET verify_status = 2 WHERE mobile_number = ? AND purpose = ? AND verify_status = 0',
        [mobile, purpose], 'sendotp-expire-old');
    await db.query(
        'INSERT INTO otp_verifications (ref_type, ref_id, mobile_number, otp_code, purpose, verify_status, expires_at, i_ts, d_in) ' +
        'VALUES (?, ?, ?, ?, ?, 0, NOW() + INTERVAL ? MINUTE, NOW(), 0)',
        [refType, row.id, mobile, code, purpose, OTP_MINUTES], 'sendotp-insert');

    // No SMS provider is wired up for the partner app yet: the code is logged
    // for testing. Replace with the SMS gateway (MV_SMS_*) before going live.
    console.log('[partner_app] OTP for ' + mobile + ' (' + purpose + '): ' + code);
    return res.json({ status: 200, message: 'OTP sent', expires_in: OTP_MINUTES * 60 });
});

async function consumeOtp(mobile, code, purpose) {
    var row = await db.one(
        'SELECT id, otp_code FROM otp_verifications WHERE mobile_number = ? AND purpose = ? AND verify_status = 0 AND expires_at > NOW() AND d_in = 0 ' +
        'ORDER BY id DESC LIMIT 1', [mobile, purpose], 'otp-latest');
    if (!row) return 'Code expired. Request a new one.';
    if (String(row.otp_code) !== String(code)) return 'Incorrect code. Check the SMS and try again.';
    await db.query('UPDATE otp_verifications SET verify_status = 1 WHERE id = ?', [row.id], 'otp-verified');
    return null;
}

// POST /verifyotp { mobile, otp, role }
exports.verifyotp = db.handle(async function (req, res) {
    var mobile = cleanMobile(req.body.mobile);
    var role = req.body.role;
    if (mobile.length !== 10 || !/^\d{6}$/.test(String(req.body.otp || ''))) return db.refuse(res, 'Enter the 6-digit code.');

    var found = await findAccounts(mobile);
    var row = roleRow(found, role);
    if (!row) return db.refuse(res, "This number isn't registered as " + ROLE_NAME[role] + '.');
    if (Number(row.login_status) === 1) return db.refuse(res, BLOCKED);

    var problem = await consumeOtp(mobile, req.body.otp, 'login');
    if (problem) return db.refuse(res, problem);
    return res.json({
        status: 200,
        token: tokenFor(role, row, mobile),
        role: role,
        account: accountJson(mobile, found),
        branding: await branding.load(row.tenant_id)
    });
});

// POST /resetpassword { mobile, otp, password }
exports.resetpassword = db.handle(async function (req, res) {
    var mobile = cleanMobile(req.body.mobile);
    var password = String(req.body.password || '');
    if (password.length < 6) return db.refuse(res, 'Use at least 6 characters.');
    var problem = await consumeOtp(mobile, req.body.otp, 'password_reset');
    if (problem) return db.refuse(res, problem);

    // Stored the same way the admin dashboard stores passwords (see passwordMatches).
    await db.query('UPDATE vendors SET pwd = ? WHERE vendor_mobile_number = ? AND d_in = 0', [password, mobile], 'reset-vendor');
    await db.query('UPDATE delivery_partners SET pwd = ? WHERE mobile_number = ? AND d_in = 0', [password, mobile], 'reset-partner');
    await db.query('UPDATE franchises SET pwd = ? WHERE mobile_number = ? AND d_in = 0', [password, mobile], 'reset-franchise');
    return res.json({ status: 200, message: 'Password updated' });
});

// GET /getaccount
exports.getaccount = db.handle(async function (req, res) {
    var found = await findAccounts(req.partner.mobile);
    return res.json({
        status: 200,
        role: req.partner.role,
        account: accountJson(req.partner.mobile, found),
        branding: await branding.load(req.partner.tenant_id)
    });
});

// POST /switchrole { role }
exports.switchrole = db.handle(async function (req, res) {
    var role = req.body.role;
    var found = await findAccounts(req.partner.mobile);
    var row = roleRow(found, role);
    if (!row) return db.refuse(res, "This number isn't registered as " + ROLE_NAME[role] + '.');
    if (Number(row.login_status) === 1) return db.refuse(res, BLOCKED);
    return res.json({
        status: 200,
        token: tokenFor(role, row, req.partner.mobile),
        role: role,
        account: accountJson(req.partner.mobile, found),
        branding: await branding.load(row.tenant_id)
    });
});

// GET /getbranding?tenant= - public, so the sign-in screen is themed before anyone signs in.
exports.getbranding = db.handle(async function (req, res) {
    var tenantId = await branding.resolveTenant(req.query.tenant);
    return res.json({ status: 200, tenant_id: tenantId, branding: await branding.load(tenantId) });
});

/**
 * POST /updatebankaccount { accountNumber, ifsc, holder?, bank? }
 *
 * Where the account's payouts are sent. Vendors keep a bank name and an account
 * holder; delivery_partners have only the number and the IFSC, so their bank
 * name is derived from the IFSC prefix when it is read back.
 *
 * TODO(security): this saves on the caller's word alone. A payout destination is
 * worth stealing, so it should require an OTP to the registered mobile (the
 * /sendotp + /verifyotp pair already exists) or an approval step in the admin
 * dashboard before it takes effect.
 */
exports.updatebankaccount = db.handle(async function (req, res) {
    var p = req.partner;
    var account = String(req.body.accountNumber || '').trim();
    var ifsc = String(req.body.ifsc || '').trim().toUpperCase();
    var holder = String(req.body.holder || '').trim();
    var bank = String(req.body.bank || '').trim();

    var banking = { bank_account_number: account, bank_ifsc_code: ifsc, bank_account_holder: holder, bank_name: bank };
    var errors = require('../../validators/mstrVldt').validateBankDetails(banking, p.role === 'vendor');
    if (Object.keys(errors).length) return db.refuse(res, Object.values(errors)[0]);

    if (p.role === 'vendor') {
        if (!holder) return db.refuse(res, "Enter the account holder's name.");
        await db.query(
            'UPDATE vendors SET bank_name = ?, bank_account_number = ?, bank_ifsc_code = ?, bank_account_holder = ? WHERE id = ? AND d_in = 0',
            [bank || null, account, ifsc, holder, p.id], 'update-bank-vendor');
    } else if (p.role === 'franchise') {
        if (!holder) return db.refuse(res, "Enter the account holder's name.");
        await db.query(
            'UPDATE franchises SET bank_name = ?, bank_account_number = ?, bank_ifsc_code = ?, bank_account_holder = ? WHERE id = ? AND d_in = 0',
            [bank || null, account, ifsc, holder, p.id], 'update-bank-franchise');
    } else {
        await db.query(
            'UPDATE delivery_partners SET bank_account_number = ?, bank_ifsc_code = ? WHERE id = ? AND d_in = 0',
            [account, ifsc, p.id], 'update-bank-partner');
    }
    return res.json({ status: 200, message: 'Bank account updated' });
});
