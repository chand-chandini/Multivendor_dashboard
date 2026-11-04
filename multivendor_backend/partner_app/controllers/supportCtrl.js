// Partner App - support, policy links and account requests.
//
// Everything here is shared by both workspaces: the token says which account is
// calling, and each row is written against that account only.

var db = require('../lib/db');

var REF_TYPE = { vendor: 'vendor', delivery: 'delivery', franchise: 'franchise' };

/** support_tickets.raised_by_type uses the platform's longer name. */
var RAISED_BY = { vendor: 'vendor', delivery: 'delivery_partner', franchise: 'franchise' };

/** Topics the app offers. Anything else is refused rather than stored as free text. */
var TOPICS = [
    'Order issue',
    'Payment or payout',
    'Customer behaviour',
    'App problem',
    'Store or menu',
    'Pickup or delivery',
    'Something else'
];

function partnerOf(req) {
    return { role: req.partner.role, id: req.partner.id, tenant: req.partner.tenant_id };
}

/**
 * GET /getsupport
 *
 * The contact details and policy links the tenant configured in the admin
 * dashboard. Anything not configured comes back null, and the app hides that
 * action rather than showing a button that goes nowhere.
 */
exports.getsupport = db.handle(async function (req, res) {
    var s = await db.one(
        'SELECT support_email, support_phone, terms_url, privacy_url FROM tenant_settings WHERE tenant_id = ? AND d_in = 0 LIMIT 1',
        [req.partner.tenant_id], 'support-settings');
    return res.json({
        status: 200,
        support: {
            phone: (s && s.support_phone) || null,
            email: (s && s.support_email) || null,
            termsUrl: (s && s.terms_url) || null,
            privacyUrl: (s && s.privacy_url) || null,
            topics: TOPICS
        }
    });
});

/**
 * POST /raiseticket { topic, description?, orderId? }
 *
 * Opens a real support ticket and returns the reference the app shows. The
 * reference is derived from the row id, so it is unique without a counter.
 */
exports.raiseticket = db.handle(async function (req, res) {
    var p = partnerOf(req);
    var topic = String(req.body.topic || '').trim();
    var description = String(req.body.description || '').trim();
    if (TOPICS.indexOf(topic) === -1) return db.refuse(res, 'Choose what the problem is about.');

    // An order reference is optional, but if one is given it must belong to the
    // caller — a vendor may only attach their own orders, a partner only orders
    // they were assigned.
    var orderId = Number(req.body.orderId) || null;
    if (orderId) {
        var owned = p.role === 'franchise'
            ? await db.one('SELECT o.id FROM orders o JOIN vendors v ON v.id = o.vendor_id WHERE o.id = ? AND v.franchise_id = ? AND o.d_in = 0',
                [orderId, p.id], 'ticket-order-franchise')
            : p.role === 'vendor'
            ? await db.one('SELECT id FROM orders WHERE id = ? AND vendor_id = ? AND d_in = 0', [orderId, p.id], 'ticket-order-vendor')
            : await db.one('SELECT o.id FROM orders o JOIN delivery_assignments da ON da.order_id = o.id ' +
                'WHERE o.id = ? AND da.delivery_partner_id = ? AND da.d_in = 0 AND o.d_in = 0 LIMIT 1',
                [orderId, p.id], 'ticket-order-partner');
        if (!owned) return db.refuse(res, 'That order is not on your account.');
    }

    var inserted = await db.query(
        'INSERT INTO support_tickets (tenant_id, raised_by_type, vendor_id, delivery_partner_id, franchise_id, order_id, subject, description, priority, status, i_ts, d_in) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), 0)',
        [
            p.tenant,
            RAISED_BY[p.role],
            p.role === 'vendor' ? p.id : null,
            p.role === 'delivery' ? p.id : null,
            p.role === 'franchise' ? p.id : null,
            orderId,
            topic,
            description || null,
            'medium'
        ], 'ticket-insert');

    var reference = 'SR-' + (10000 + Number(inserted.insertId));
    await db.query('UPDATE support_tickets SET ticket_reference = ? WHERE id = ?', [reference, inserted.insertId], 'ticket-reference');

    // The first message keeps the thread readable in the dashboard.
    if (description) {
        await db.query(
            'INSERT INTO support_messages (support_ticket_id, sender_type, sender_id, message, i_ts, d_in) VALUES (?, ?, ?, ?, NOW(), 0)',
            [inserted.insertId, RAISED_BY[p.role], p.id, description], 'ticket-message');
    }

    return res.json({ status: 200, message: 'Ticket ' + reference + ' raised', reference: reference, ticketId: inserted.insertId });
});

// ─── Account requests ────────────────────────────────────────────────────────

async function openRequest(p, type) {
    return db.one(
        'SELECT id, reference FROM partner_account_requests WHERE ref_type = ? AND ref_id = ? AND request_type = ? AND status = 0 AND d_in = 0 LIMIT 1',
        [REF_TYPE[p.role], p.id, type], 'account-request-open');
}

async function recordRequest(p, type, prefix, reason) {
    var inserted = await db.query(
        'INSERT INTO partner_account_requests (ref_type, ref_id, tenant_id, request_type, reason, status, i_ts, d_in) VALUES (?, ?, ?, ?, ?, 0, NOW(), 0)',
        [REF_TYPE[p.role], p.id, p.tenant, type, reason || null], 'account-request-insert');
    var reference = prefix + '-' + (1000 + Number(inserted.insertId));
    await db.query('UPDATE partner_account_requests SET reference = ? WHERE id = ?', [reference, inserted.insertId], 'account-request-reference');
    return reference;
}

/** Work that has to finish before an account can be closed. */
async function unfinishedWork(p) {
    if (p.role === 'vendor') {
        var live = await db.one(
            'SELECT COUNT(*) AS n FROM orders WHERE vendor_id = ? AND d_in = 0 AND order_status IN (0,1,2,7)', [p.id], 'delete-open-orders');
        if (Number(live.n) > 0) return Number(live.n) + ' order(s) are still open. Finish or cancel them first.';
        return null;
    }
    if (p.role === 'franchise') return null;
    var trip = await db.one(
        'SELECT COUNT(*) AS n FROM delivery_assignments WHERE delivery_partner_id = ? AND d_in = 0 AND assignment_status IN (1,2)',
        [p.id], 'delete-open-trips');
    if (Number(trip.n) > 0) return 'Finish your active delivery before closing the account.';
    return null;
}

/**
 * POST /requestaccountdeletion { reason? }
 *
 * Records the request; it does not delete anything. Orders, payouts and tax
 * records have to outlive the account, so closing one is a reviewed action
 * rather than a row being removed the moment a button is tapped. The account
 * keeps working until it is settled.
 */
exports.requestaccountdeletion = db.handle(async function (req, res) {
    var p = partnerOf(req);

    var already = await openRequest(p, 'delete_account');
    if (already) return db.refuse(res, 'A deletion request (' + already.reference + ') is already being reviewed.');

    var blocked = await unfinishedWork(p);
    if (blocked) return db.refuse(res, blocked);

    var reference = await recordRequest(p, 'delete_account', 'DEL', String(req.body.reason || '').trim());
    return res.json({
        status: 200,
        message: 'Deletion request ' + reference + ' received. Support will contact you before the account closes.',
        reference: reference
    });
});

/**
 * POST /requestdataexport
 *
 * Records the request. The export itself is assembled and emailed out of band,
 * because it spans orders, payouts and profile data.
 */
exports.requestdataexport = db.handle(async function (req, res) {
    var p = partnerOf(req);

    var already = await openRequest(p, 'data_export');
    if (already) return db.refuse(res, 'An export (' + already.reference + ') is already being prepared.');

    var reference = await recordRequest(p, 'data_export', 'EXP', null);
    return res.json({
        status: 200,
        message: 'Export ' + reference + ' requested. You will be emailed a link when it is ready.',
        reference: reference
    });
});

/** GET /getaccountrequests - what the Profile screen shows as pending. */
exports.getaccountrequests = db.handle(async function (req, res) {
    var p = partnerOf(req);
    var rows = await db.query(
        'SELECT request_type, reference, status, i_ts FROM partner_account_requests WHERE ref_type = ? AND ref_id = ? AND d_in = 0 ORDER BY id DESC LIMIT 10',
        [REF_TYPE[p.role], p.id], 'account-requests');
    return res.json({
        status: 200,
        requests: rows.map(function (r) {
            return { type: r.request_type, reference: r.reference, status: Number(r.status), raisedAt: new Date(r.i_ts).getTime() };
        })
    });
});
