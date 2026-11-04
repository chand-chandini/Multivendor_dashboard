// Partner App - delivery partner workspace (requests, active trip, earnings).
// GET /getpartnerstate returns everything the delivery screens render; each
// action returns { status, message } and the app refetches the state.
//
// The handover code (shown by the store) and the customer OTP (shown to the
// customer) are never sent to the partner: the partner types them in and the
// server checks them.

var db = require('../lib/db');
var fmt = require('../lib/format');
var notifications = require('../lib/notifications');
var branding = require('../lib/branding');
var prefs = require('../lib/prefs');
var history = require('../lib/orderHistory');
var dispatch = require('../lib/dispatch');
var upload = require('../middleware/upload');

var PEAK = { target: 5, reward: 120, fromHour: 18, toHour: 22 };
var SHIFTS = ['mornings', 'afternoons', 'evenings', 'nights'];
var FAILED_PAY_SHARE = dispatch.FAILED_PAY_SHARE;
var BANKS = { SBIN: 'SBI', HDFC: 'HDFC', ICIC: 'ICICI', UTIB: 'Axis', KKBK: 'Kotak', IOBA: 'IOB', IDIB: 'Indian Bank', CNRB: 'Canara', BARB: 'BoB', PUNB: 'PNB' };

async function partnerFor(req) {
    return db.one(
        'SELECT dp.*, l.city AS location_city, l.area AS location_area FROM delivery_partners dp LEFT JOIN locations l ON l.id = dp.location_id ' +
        'WHERE dp.id = ? AND dp.tenant_id = ? AND dp.d_in = 0', [req.partner.id, req.partner.tenant_id], 'partner-self');
}

function withPartner(fn) {
    return db.handle(async function (req, res) {
        var partner = await partnerFor(req);
        if (!partner) return res.status(401).json({ status: 401, message: 'Delivery partner account not found' });
        return fn(req, res, partner);
    });
}

function bankLabel(partner) {
    var code = String(partner.bank_ifsc_code || '').slice(0, 4).toUpperCase();
    return ((BANKS[code] || code) + ' ' + fmt.masked(partner.bank_account_number)).trim();
}

function pay(a) {
    return {
        base: Math.round(fmt.num(a.base_pay)),
        distance: Math.round(fmt.num(a.distance_pay)),
        tip: Math.round(fmt.num(a.tip_pay))
    };
}

function total(p) {
    return p.base + p.distance + p.tip;
}

// ─── Requests ────────────────────────────────────────────────────────────────

var ASSIGNMENT_SELECT =
    'SELECT da.*, o.order_number, o.order_status, o.payment_type, o.grand_total, o.parcel_count, o.prep_minutes, o.accepted_at AS order_accepted_at, ' +
    'o.ready_at, o.order_instructions, v.vendor_name, v.vendor_address, v.store_category, v.latitude AS v_lat, v.longitude AS v_lng, ' +
    'vl.area AS vendor_area, c.customer_name, a.full_address, a.landmark, a.latitude AS a_lat, a.longitude AS a_lng ' +
    'FROM delivery_assignments da JOIN orders o ON o.id = da.order_id JOIN vendors v ON v.id = o.vendor_id ' +
    'LEFT JOIN locations vl ON vl.id = v.location_id LEFT JOIN customers c ON c.id = o.customer_id ' +
    'LEFT JOIN customer_addresses a ON a.id = o.customer_address_id ';

async function itemsFor(orderIds) {
    if (!orderIds.length) return [];
    return db.query(
        'SELECT oi.order_id, oi.product_name_snapshot, oi.quantity, pv.variant_name FROM order_items oi ' +
        'LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id WHERE oi.order_id IN (?) AND oi.d_in = 0 ORDER BY oi.id',
        [orderIds], 'partner-order-items');
}

/** "10 kg sack" x1 -> 10, "500 g" x2 -> 1, "1 L" -> 1. Unknown sizes count as 0.5 kg. */
function approxKg(lines) {
    var kg = lines.reduce(function (sum, l) {
        var m = String(l.variant_name || l.product_name_snapshot || '').match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)\b/i);
        var each = 0.5;
        if (m) {
            var n = Number(m[1]), unit = m[2].toLowerCase();
            each = unit === 'g' || unit === 'ml' ? n / 1000 : n;
        }
        return sum + each * fmt.num(l.quantity, 1);
    }, 0);
    return Math.max(1, Math.round(kg));
}

function cashWarning(row) {
    return { title: 'Collect ' + fmt.inr(row.grand_total) + ' cash', body: 'COD order. Cash is settled against your next payout.' };
}

function pickupSheet(category, row, lines, etaMin) {
    var parcels = fmt.num(row.parcel_count, 1) || 1;
    var cod = row.payment_type === 'cod';
    var tag = String(row.order_number || row.order_id).replace(/\D/g, '');

    if (category === 'grocery') {
        var kg = approxKg(lines);
        var bags = [];
        for (var i = 1; i <= parcels; i++) bags.push({ key: 'bag' + i, label: 'Bag ' + i, hint: 'tag ' + tag + '-' + i });
        return {
            kind: 'grocery', bags: bags, weightKg: kg,
            warning: cod ? cashWarning(row) : kg >= 8
                ? { title: 'Heavy load · ' + kg + ' kg', body: 'Secure heavy bags in the footwell, not on the seat.' }
                : { title: 'Keep bags upright', body: 'Liquids and eggs on top, nothing heavy over them.' }
        };
    }
    if (category === 'produce') {
        return {
            kind: 'produce',
            weighed: lines.map(function (l) {
                return { name: l.product_name_snapshot, ordered: 'ordered ' + (l.variant_name || fmt.num(l.quantity) + ' × 1'), actual: 'check slip' };
            }),
            billed: Math.round(fmt.num(row.grand_total)),
            checklist: [
                { key: 'weights', label: 'Weights match the slip' },
                { key: 'greens', label: 'Greens on top, no crushing' }
            ]
        };
    }
    if (category === 'bakery') {
        return {
            kind: 'bakery',
            banner: { title: 'Fragile · keep flat', body: 'Keep boxes flat in the crate. No hot bag. Do not stack anything on top.' },
            checklist: [
                { key: 'sealed', label: 'Box sealed and taped' },
                { key: 'flat', label: 'Placed flat in delivery crate' }
            ],
            message: row.order_instructions ? '"' + row.order_instructions + '"' : '—',
            slot: 'Deliver within ' + etaMin + ' min'
        };
    }
    if (category === 'meat') {
        return {
            kind: 'meat',
            banner: { title: 'Cold chain order', body: 'Insulated bag with ice pack. Deliver within 35 minutes of pickup.' },
            checklist: [
                { key: 'leak', label: 'Leak-proof pouch, no seepage' },
                { key: 'ice', label: 'Ice pack in the bag' },
                { key: 'apart', label: 'Kept away from other orders' }
            ],
            lines: lines.map(function (l) { return { name: l.product_name_snapshot, weight: l.variant_name || '×' + fmt.num(l.quantity) }; }),
            warning: cod ? cashWarning(row) : { title: 'Keep it cold', body: 'Do not leave the bag in the sun while you wait.' }
        };
    }
    return {
        kind: 'food',
        checklist: [
            { key: 'parcels', label: parcels + ' sealed parcel' + (parcels > 1 ? 's' : '') + ' collected' },
            { key: 'upright', label: 'Placed upright in the hot bag' },
            { key: 'gravy', label: 'Gravy items kept separate' }
        ],
        deliverWithinMin: etaMin,
        warning: cod ? cashWarning(row) : { title: 'Hot bag required', body: 'Do not stack other orders on top of food boxes.' }
    };
}

function requestStatus(row, takenByOther) {
    switch (Number(row.assignment_status)) {
        case 0: return 'open';
        case 1:
        case 2: return 'accepted';
        case 3: return 'done';
        case 4: return 'skipped';
        default: return takenByOther ? 'taken' : 'done';
    }
}

function requestJson(row, partner, lines, takenByOther) {
    var category = fmt.category(row.store_category);
    var storeKm = fmt.km(partner.latitude, partner.longitude, row.v_lat, row.v_lng);
    var dropKm = fmt.num(row.distance_km) || fmt.km(row.v_lat, row.v_lng, row.a_lat, row.a_lng);
    var totalKm = Math.round((storeKm + dropKm) * 10) / 10;
    var etaMin = Math.max(10, Math.round(totalKm * 3.5 + 6));
    var p = pay(row);
    var now = Date.now();

    var readyInMin = 0, waitingMin;
    if (Number(row.order_status) === 7) {
        waitingMin = row.ready_at ? Math.max(0, Math.floor((now - fmt.ms(row.ready_at)) / 60000)) : undefined;
    } else if (row.order_accepted_at) {
        var readyAt = fmt.ms(row.order_accepted_at) + fmt.num(row.prep_minutes, 15) * 60000;
        readyInMin = Math.max(0, Math.ceil((readyAt - now) / 60000));
    }

    var cod = row.payment_type === 'cod';
    return {
        assignmentId: row.id,
        orderId: row.order_id,
        id: row.order_number || String(row.order_id),
        category: category,
        status: requestStatus(row, takenByOther),
        store: {
            name: row.vendor_name,
            area: row.vendor_area || fmt.areaFrom(row.vendor_address),
            address: row.vendor_address || '',
            distanceKm: storeKm,
            note: '',
            // For the map on the active trip.
            latitude: row.v_lat === null ? null : fmt.num(row.v_lat),
            longitude: row.v_lng === null ? null : fmt.num(row.v_lng)
        },
        drop: {
            name: row.customer_name || 'Customer',
            area: fmt.areaFrom(row.full_address),
            address: (row.full_address || '') + (row.landmark ? ' · ' + row.landmark : ''),
            distanceKm: dropKm,
            latitude: row.a_lat === null ? null : fmt.num(row.a_lat),
            longitude: row.a_lng === null ? null : fmt.num(row.a_lng)
        },
        payout: total(p),
        breakdown: p,
        totalKm: totalKm,
        etaMin: etaMin,
        payment: cod ? 'cod' : 'prepaid',
        codAmount: cod ? Math.round(fmt.num(row.grand_total)) : undefined,
        orderTotal: Math.round(fmt.num(row.grand_total)),
        items: lines.reduce(function (s, l) { return s + fmt.num(l.quantity, 1); }, 0),
        parcels: fmt.num(row.parcel_count, 1) || 1,
        readyInMin: readyInMin,
        waitingMin: waitingMin || undefined,
        handoverCode: '',
        customerOtp: '',
        pickup: pickupSheet(category, row, lines, etaMin),
        expiresAt: fmt.ms(row.offer_expires_at)
    };
}

function stageOf(row) {
    var status = Number(row.assignment_status);
    if (status === 1) return row.arrived_store_at ? 'at_store' : 'to_store';
    if (status === 2) return row.arrived_customer_at ? 'arrived' : 'on_the_way';
    return 'complete';
}

function activeJson(row) {
    return {
        requestId: row.order_number || String(row.order_id),
        assignmentId: row.id,
        stage: stageOf(row),
        acceptedAt: fmt.ms(row.accepted_at),
        arrivedStoreAt: fmt.ms(row.arrived_store_at),
        pickedUpAt: fmt.ms(row.picked_up_at),
        deliveredAt: fmt.ms(row.delivered_at),
        checks: {},
        proofPhoto: Boolean(row.proof_photo),
        handoverRating: row.handover_rating || undefined
    };
}

function tripJson(row) {
    var p = pay(row);
    var delivered = Number(row.assignment_status) === 3;
    var end = fmt.ms(row.delivered_at) || fmt.ms(row.picked_up_at) || fmt.ms(row.accepted_at) || fmt.ms(row.assigned_at);
    return {
        id: row.order_number || String(row.order_id),
        assignmentId: row.id,
        store: row.vendor_name,
        category: fmt.category(row.store_category),
        at: end,
        km: fmt.num(row.distance_km),
        minutes: row.accepted_at && end ? Math.max(1, Math.round((end - fmt.ms(row.accepted_at)) / 60000)) : 0,
        earning: total(p),
        tip: p.tip,
        status: delivered ? 'delivered' : 'cancelled',
        note: delivered ? undefined : String(row.failure_reason || 'cancelled').toLowerCase(),
        customer: row.customer_name || undefined,
        verifiedBy: delivered ? 'Customer OTP' : undefined,
        breakdown: p
    };
}

// ─── Earnings ────────────────────────────────────────────────────────────────

function isPeak(date) {
    var h = new Date(date).getHours();
    return h >= PEAK.fromHour && h < PEAK.toHour;
}

async function loadWeek(partner) {
    var rows = await db.query(
        'SELECT delivered_at, distance_km, base_pay, distance_pay, tip_pay, assignment_status FROM delivery_assignments ' +
        'WHERE delivery_partner_id = ? AND d_in = 0 AND assignment_status IN (3,5) AND accepted_at IS NOT NULL ' +
        'AND COALESCE(delivered_at, picked_up_at, accepted_at) >= CURDATE() - INTERVAL 6 DAY', [partner.id], 'partner-week');

    var days = [];
    for (var i = 6; i >= 0; i--) days.push({ date: new Date(Date.now() - i * 86400000), amount: 0, peakTrips: 0 });
    var sum = { trips: 0, km: 0, base: 0, distance: 0, tips: 0, peak: 0 };
    rows.forEach(function (r) {
        var p = pay(r);
        sum.base += p.base;
        sum.distance += p.distance;
        sum.tips += p.tip;
        var when = r.delivered_at ? new Date(r.delivered_at) : null;
        if (Number(r.assignment_status) === 3) {
            sum.trips += 1;
            sum.km += fmt.num(r.distance_km);
        }
        var day = when && days.find(function (d) { return d.date.toDateString() === when.toDateString(); });
        if (day) {
            day.amount += total(p);
            if (Number(r.assignment_status) === 3 && isPeak(when)) day.peakTrips += 1;
        }
    });
    days.forEach(function (d) {
        if (d.peakTrips >= PEAK.target) {
            d.amount += PEAK.reward;
            sum.peak += PEAK.reward;
        }
    });
    var max = Math.max.apply(null, days.map(function (d) { return d.amount; }).concat([1]));
    var payout = new Date(Date.now() + 3 * 86400000);
    return {
        label: 'This week · ' + fmt.rangeLabel(days[0].date, days[6].date),
        trips: sum.trips,
        km: Math.round(sum.km),
        total: sum.base + sum.distance + sum.tips + sum.peak,
        base: sum.base,
        distance: sum.distance,
        peak: sum.peak,
        tips: sum.tips,
        bars: days.map(function (d) { return Math.max(0.06, d.amount / max); }),
        payoutDate: fmt.dayName(payout) + ', ' + fmt.dayMonth(payout),
        bank: bankLabel(partner)
    };
}

async function loadStatements(partner, week) {
    var rows = await db.query(
        'SELECT * FROM delivery_partner_settlements WHERE delivery_partner_id = ? AND d_in = 0 ORDER BY settlement_period_end DESC LIMIT 8',
        [partner.id], 'partner-statements');
    var current = {
        id: 'current',
        label: week.label.replace('This week · ', ''),
        trips: week.trips,
        amount: week.total,
        status: 'pending',
        note: 'Payout on ' + week.payoutDate
    };
    return [current].concat(rows.map(function (s) {
        var paid = Number(s.settlement_status) === 1;
        return {
            id: String(s.id),
            label: fmt.rangeLabel(s.settlement_period_start, s.settlement_period_end),
            trips: fmt.num(s.total_orders),
            amount: Math.round(fmt.num(s.net_payable)),
            status: paid ? 'paid' : 'pending',
            note: paid ? 'Paid ' + fmt.dayMonth(s.paid_at || s.settlement_period_end) + ' · ' + bankLabel(partner) : 'Processing'
        };
    }));
}

/** The zones a partner can pick: the tenant's serviced locations. */
async function loadZones(partner) {
    var rows = await db.query(
        'SELECT area, city, pincode FROM locations WHERE tenant_id = ? AND d_in = 0 AND active_status = 1 ORDER BY city, area',
        [partner.tenant_id], 'partner-zones');
    var zones = rows.map(function (l) {
        return { key: l.area, detail: [l.city, l.pincode].filter(Boolean).join(' · ') };
    });
    // Whatever the partner is on today stays selectable, even if the tenant
    // renamed or removed that location.
    if (partner.zone_name && !zones.some(function (z) { return z.key === partner.zone_name; })) {
        zones.unshift({ key: partner.zone_name, detail: 'Current zone' });
    }
    return zones;
}

async function loadProfile(partner) {
    var stats = await db.one(
        'SELECT SUM(assignment_status = 3) AS delivered, SUM(accepted_at IS NOT NULL) AS accepted, SUM(assignment_status = 4) AS skipped, ' +
        'SUM(assignment_status = 5 AND accepted_at IS NOT NULL) AS failed, ' +
        'SUM(assignment_status = 3 AND picked_up_at IS NOT NULL AND delivered_at <= picked_up_at + INTERVAL 35 MINUTE) AS on_time ' +
        'FROM delivery_assignments WHERE delivery_partner_id = ? AND d_in = 0', [partner.id], 'partner-stats');
    var delivered = fmt.num(stats.delivered), accepted = fmt.num(stats.accepted);
    var pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
    var mobile = String(partner.mobile_number || '');
    var type = String(partner.vehicle_type || '');
    return {
        name: partner.name,
        initials: fmt.initials(partner.name),
        id: 'DP-' + partner.id,
        mobile: mobile ? '+91 ' + mobile.slice(0, 5) + ' ' + mobile.slice(5) : '',
        rating: fmt.num(partner.rating),
        trips: delivered,
        onTime: pct(fmt.num(stats.on_time), delivered),
        acceptance: pct(accepted, accepted + fmt.num(stats.skipped)),
        cancels: pct(fmt.num(stats.failed), accepted),
        vehicle: partner.vehicle_number || '—',
        vehicleType: type ? type.charAt(0).toUpperCase() + type.slice(1) : '—',
        licence: partner.driving_license_number || '—',
        // Documents the row actually holds; never the full number.
        aadhaar: fmt.aadhaar(partner.aadhar_number),
        pan: fmt.pan(partner.pan_number),
        kycVerified: Number(partner.kyc_status) === 1,
        licenceValid: Number(partner.kyc_status) === 1 ? 'Verified' : 'Verification pending',
        bank: bankLabel(partner),
        ifsc: partner.bank_ifsc_code || '—',
        zone: partner.zone_name || partner.location_area || '—',
        zoneArea: [partner.location_area, partner.location_city].filter(Boolean).join(', '),
        shift: partner.shift_preference || 'evenings'
    };
}

// GET /getpartnerstate
exports.getpartnerstate = withPartner(async function (req, res, partner) {
    // Follow what happened to the orders elsewhere (the admin dashboard) and offer a free partner what is still
    // waiting. A failure here must not take the screen down with it: the state below is still right.
    try {
        await dispatch.reconcile(partner);
        await dispatch.offerWaitingOrders(partner);
    } catch (e) {
        console.error('[partner_app] dispatch', e && e.message);
    }

    var offers = await db.query(ASSIGNMENT_SELECT +
        'WHERE da.delivery_partner_id = ? AND da.d_in = 0 AND (' +
        '  (da.assignment_status = 0 AND (da.offer_expires_at IS NULL OR da.offer_expires_at > NOW()) AND o.order_status IN (1,2,7) ' +
        '    AND (o.payment_type <> \'cod\' OR ? IS NULL OR ? <> 0)) ' +
        '  OR (da.assignment_status = 5 AND da.accepted_at IS NULL AND da.assigned_at >= NOW() - INTERVAL 30 MINUTE)' +
        ') ORDER BY da.assigned_at DESC LIMIT 20', [partner.id, partner.cod_limit, partner.cod_limit], 'partner-offers');
    var activeRow = await db.one(ASSIGNMENT_SELECT +
        'WHERE da.delivery_partner_id = ? AND da.d_in = 0 AND da.assignment_status IN (1,2) ORDER BY da.accepted_at DESC LIMIT 1',
        [partner.id], 'partner-active');
    var tripRows = await db.query(ASSIGNMENT_SELECT +
        'WHERE da.delivery_partner_id = ? AND da.d_in = 0 AND da.assignment_status IN (3,5) AND da.accepted_at IS NOT NULL ' +
        'AND COALESCE(da.delivered_at, da.picked_up_at, da.accepted_at) >= CURDATE() ORDER BY COALESCE(da.delivered_at, da.accepted_at) DESC',
        [partner.id], 'partner-trips');

    var orderIds = offers.concat(activeRow ? [activeRow] : []).map(function (r) { return r.order_id; });
    var lines = await itemsFor(orderIds);
    var linesOf = function (orderId) { return lines.filter(function (l) { return l.order_id === orderId; }); };

    // Offers that another partner accepted show as "taken" for a short while.
    var cancelled = offers.filter(function (r) { return Number(r.assignment_status) === 5; }).map(function (r) { return r.order_id; });
    var takenOrders = cancelled.length ? await db.query(
        'SELECT DISTINCT order_id FROM delivery_assignments WHERE order_id IN (?) AND delivery_partner_id <> ? AND assignment_status IN (1,2,3) AND d_in = 0',
        [cancelled, partner.id], 'partner-taken') : [];
    var taken = takenOrders.map(function (r) { return r.order_id; });

    var requests = offers
        .filter(function (r) { return Number(r.assignment_status) === 0 || taken.indexOf(r.order_id) >= 0; })
        .map(function (r) { return requestJson(r, partner, linesOf(r.order_id), true); });

    var trips = tripRows.map(tripJson);
    var delivered = trips.filter(function (t) { return t.status === 'delivered'; });
    var results = await Promise.all([
        loadWeek(partner),
        loadProfile(partner),
        notifications.load(partner.tenant_id, 'delivery_partner', partner.id),
        branding.load(partner.tenant_id),
        prefs.load('delivery_partner', partner.id),
        loadZones(partner)
    ]);
    var settings = results[4];
    var week = results[0];

    return res.json({
        status: 200,
        data: {
            profile: results[1],
            online: Number(partner.is_online) === 1,
            onlineSince: fmt.ms(partner.online_since) || Date.now(),
            requests: requests,
            active: activeRow ? activeJson(activeRow) : null,
            activeRequest: activeRow ? requestJson(activeRow, partner, linesOf(activeRow.order_id), false) : null,
            trips: trips,
            today: {
                deliveries: delivered.length,
                km: Math.round(delivered.reduce(function (s, t) { return s + t.km; }, 0)),
                earned: trips.reduce(function (s, t) { return s + t.earning; }, 0),
                peakDone: Math.min(PEAK.target, delivered.filter(function (t) { return isPeak(t.at); }).length),
                peakTarget: PEAK.target,
                peakReward: PEAK.reward
            },
            week: week,
            statements: await loadStatements(partner, week),
            prefs: {
                zone: partner.zone_name || '',
                shift: partner.shift_preference || 'evenings',
                requestAlerts: settings.alerts
            },
            zones: results[5],
            options: { shifts: SHIFTS },
            notifications: results[2],
            branding: results[3]
        }
    });
});

// ─── Actions ─────────────────────────────────────────────────────────────────

async function assignmentFor(partner, id, statuses) {
    return db.one(
        'SELECT da.*, o.order_status, o.order_number, o.payment_type, o.handover_code, o.delivery_otp, o.vendor_id FROM delivery_assignments da JOIN orders o ON o.id = da.order_id ' +
        'WHERE da.id = ? AND da.delivery_partner_id = ? AND da.d_in = 0 AND da.assignment_status IN (?)',
        [id, partner.id, statuses], 'partner-assignment');
}

// POST /updateonline { is_online }
exports.updateonline = withPartner(async function (req, res, partner) {
    var on = req.body.is_online ? 1 : 0;
    if (!on) {
        var busy = await db.one('SELECT id FROM delivery_assignments WHERE delivery_partner_id = ? AND assignment_status IN (1,2) AND d_in = 0 LIMIT 1',
            [partner.id], 'partner-busy');
        if (busy) return db.refuse(res, 'Finish your current trip before going offline.');
    }
    await db.query('UPDATE delivery_partners SET is_online = ?, online_since = IF(? = 1, NOW(), online_since) WHERE id = ?',
        [on, on, partner.id], 'partner-online');
    return res.json({ status: 200, message: on ? 'You are online' : 'You are offline' });
});

// POST /acceptrequest { assignment_id }
exports.acceptrequest = withPartner(async function (req, res, partner) {
    var busy = await db.one('SELECT id FROM delivery_assignments WHERE delivery_partner_id = ? AND assignment_status IN (1,2) AND d_in = 0 LIMIT 1',
        [partner.id], 'accept-busy');
    if (busy) return db.refuse(res, 'Finish your current trip before accepting another.');

    var offer = await assignmentFor(partner, req.body.assignment_id, [0]);
    if (!offer) return db.refuse(res, 'This request is no longer available.');
    if (offer.offer_expires_at && fmt.ms(offer.offer_expires_at) < Date.now()) return db.refuse(res, 'This request has expired.');

    // Recheck the saved limit even for offers created before an Admin update.
    if (offer.payment_type === 'cod' && partner.cod_limit != null && Number(partner.cod_limit) === 0) {
        return db.refuse(res, 'Your COD limit does not allow cash on delivery orders.');
    }

    // Only one partner can hold an order: the derived table lets MySQL check
    // delivery_assignments while updating it.
    var result = await db.query(
        'UPDATE delivery_assignments SET assignment_status = 1, accepted_at = NOW() WHERE id = ? AND assignment_status = 0 AND order_id NOT IN (' +
        '  SELECT order_id FROM (SELECT order_id FROM delivery_assignments WHERE assignment_status IN (1,2,3) AND d_in = 0) held)',
        [offer.id], 'accept-request');
    if (!result.affectedRows) return db.refuse(res, 'Another partner accepted this order.');

    var holders = await db.query('SELECT id FROM delivery_assignments WHERE order_id = ? AND assignment_status IN (1,2,3) AND d_in = 0 ORDER BY accepted_at, id',
        [offer.order_id], 'accept-holders');
    if (holders.length > 1 && holders[0].id !== offer.id) {
        await db.query('UPDATE delivery_assignments SET assignment_status = 5, accepted_at = NULL WHERE id = ?', [offer.id], 'accept-revert');
        return db.refuse(res, 'Another partner accepted this order.');
    }
    await db.query('UPDATE delivery_assignments SET assignment_status = 5 WHERE order_id = ? AND id <> ? AND assignment_status = 0',
        [offer.order_id, offer.id], 'accept-close-others');
    var vendor = await db.one('SELECT tenant_id FROM vendors WHERE id = ?', [offer.vendor_id], 'accept-vendor');
    if (vendor) {
        await notifications.send(vendor.tenant_id, 'vendor', offer.vendor_id, partner.name + ' is on the way',
            '#' + offer.order_number + ' · ' + (partner.vehicle_number || 'delivery partner') + ' will pick up the order.');
    }
    return res.json({ status: 200, message: 'Trip accepted' });
});

// POST /rejectrequest { assignment_id }
exports.rejectrequest = withPartner(async function (req, res, partner) {
    var result = await db.query('UPDATE delivery_assignments SET assignment_status = 4 WHERE id = ? AND delivery_partner_id = ? AND assignment_status = 0',
        [req.body.assignment_id, partner.id], 'reject-request');
    if (!result.affectedRows) return db.refuse(res, 'This request is no longer available.');
    return res.json({ status: 200, message: 'Request skipped' });
});

// POST /reachedstore { assignment_id }
exports.reachedstore = withPartner(async function (req, res, partner) {
    var result = await db.query(
        'UPDATE delivery_assignments SET arrived_store_at = COALESCE(arrived_store_at, NOW()) WHERE id = ? AND delivery_partner_id = ? AND assignment_status = 1',
        [req.body.assignment_id, partner.id], 'reached-store');
    if (!result.affectedRows) return db.refuse(res, 'No trip is heading to the store.');
    return res.json({ status: 200, message: 'Marked at store' });
});

// POST /confirmpickup { assignment_id, handover_code }
exports.confirmpickup = withPartner(async function (req, res, partner) {
    var a = await assignmentFor(partner, req.body.assignment_id, [1]);
    if (!a) return db.refuse(res, 'No trip is waiting for pickup.');
    if (Number(a.order_status) !== 7) return db.refuse(res, 'The store has not marked this order ready yet.');
    if (!a.handover_code || String(req.body.handover_code || '') !== String(a.handover_code)) {
        return db.refuse(res, 'That code doesn’t match. Ask the store to read it again.');
    }
    await db.query('UPDATE delivery_assignments SET assignment_status = 2, picked_up_at = NOW(), arrived_store_at = COALESCE(arrived_store_at, NOW()) WHERE id = ?',
        [a.id], 'pickup-assignment');
    await db.query('UPDATE orders SET order_status = 3, picked_up_at = NOW() WHERE id = ? AND order_status = 7', [a.order_id], 'pickup-order');
    await history(a.order_id, 7, 3, 'delivery_partner', partner.id, 'Picked up with handover code');
    return res.json({ status: 200, message: 'Pickup confirmed' });
});

// POST /arrivedcustomer { assignment_id }
exports.arrivedcustomer = withPartner(async function (req, res, partner) {
    var result = await db.query(
        'UPDATE delivery_assignments SET arrived_customer_at = COALESCE(arrived_customer_at, NOW()) WHERE id = ? AND delivery_partner_id = ? AND assignment_status = 2',
        [req.body.assignment_id, partner.id], 'arrived-customer');
    if (!result.affectedRows) return db.refuse(res, 'No trip is on the way.');
    return res.json({ status: 200, message: 'Marked arrived' });
});

// POST /completedelivery { assignment_id, otp, proof_photo? }
exports.completedelivery = withPartner(async function (req, res, partner) {
    var a = await assignmentFor(partner, req.body.assignment_id, [2]);
    if (!a) return db.refuse(res, 'No trip is out for delivery.');
    if (!a.delivery_otp || String(req.body.otp || '') !== String(a.delivery_otp)) {
        return db.refuse(res, 'Incorrect OTP. Ask the customer to check their app.');
    }
    await db.query(
        'UPDATE delivery_assignments SET assignment_status = 3, delivered_at = NOW(), arrived_customer_at = COALESCE(arrived_customer_at, NOW()), proof_photo = ? WHERE id = ?',
        [req.body.proof_photo ? 'captured-in-app' : null, a.id], 'complete-assignment');
    await db.query('UPDATE orders SET order_status = 4, delivered_at = NOW() WHERE id = ? AND order_status = 3', [a.order_id], 'complete-order');
    await history(a.order_id, 3, 4, 'delivery_partner', partner.id, 'Delivered · customer OTP verified');
    return res.json({ status: 200, message: 'Delivered' });
});

// POST /faildelivery { assignment_id, reason }
exports.faildelivery = withPartner(async function (req, res, partner) {
    var reason = String(req.body.reason || '').trim();
    if (!reason) return db.refuse(res, 'Choose what went wrong.');
    var a = await assignmentFor(partner, req.body.assignment_id, [1, 2]);
    if (!a) return db.refuse(res, 'No active trip to report.');

    // The partner is paid a share of the base pay for the attempt.
    await db.query(
        'UPDATE delivery_assignments SET assignment_status = 5, failure_reason = ?, delivered_at = NOW(), base_pay = ROUND(base_pay * ?), distance_pay = 0, tip_pay = 0 WHERE id = ?',
        [reason, FAILED_PAY_SHARE, a.id], 'fail-assignment');
    await db.query('UPDATE orders SET order_status = 5, cancelled_at = NOW(), cancellation_reason = ? WHERE id = ? AND order_status IN (3,7)',
        ['Delivery failed · ' + reason, a.order_id], 'fail-order');
    await history(a.order_id, a.order_status, 5, 'delivery_partner', partner.id, 'Delivery failed · ' + reason);
    return res.json({ status: 200, message: 'Reported to support' });
});

// POST /ratehandover { assignment_id, rating: slow | fine | quick }
exports.ratehandover = withPartner(async function (req, res, partner) {
    var rating = ['slow', 'fine', 'quick'].indexOf(req.body.rating) >= 0 ? req.body.rating : null;
    if (!rating) return db.refuse(res, 'Choose slow, fine or quick.');
    await db.query('UPDATE delivery_assignments SET handover_rating = ? WHERE id = ? AND delivery_partner_id = ?',
        [rating, req.body.assignment_id, partner.id], 'rate-handover');
    return res.json({ status: 200, message: 'Thanks for the feedback' });
});

// POST /updatepreferences { zone?, shift?, requestAlerts? }
exports.updatepreferences = withPartner(async function (req, res, partner) {
    var shift = SHIFTS.indexOf(req.body.shift) >= 0 ? req.body.shift : partner.shift_preference;
    var zone = req.body.zone ? String(req.body.zone).slice(0, 100) : partner.zone_name;
    await db.query('UPDATE delivery_partners SET zone_name = ?, shift_preference = ? WHERE id = ?', [zone, shift, partner.id], 'partner-prefs');
    await prefs.save('delivery_partner', partner.id, { alerts: req.body.requestAlerts });
    return res.json({ status: 200, message: 'Preferences saved' });
});

// POST /readnotifications
exports.readnotifications = withPartner(async function (req, res, partner) {
    await notifications.markRead(partner.tenant_id, 'delivery_partner', partner.id);
    return res.json({ status: 200, message: 'Marked as read' });
});

// ─── Proof of delivery ───────────────────────────────────────────────────────

/**
 * POST /uploadproof  (multipart: photo, assignment_id)
 *
 * Delivery SRS 9: "the application can capture delivery confirmation or other
 * permitted proof before completing the order", so this is accepted while the
 * trip is still running (accepted or picked up) and the stored path goes on the
 * assignment for the dashboard and the customer's receipt.
 */
exports.uploadproof = withPartner(async function (req, res, partner) {
    if (!req.file) return db.refuse(res, 'Attach a photo to upload.');

    // Scoped to this partner's own assignment, so nobody can attach a photo to
    // someone else's delivery.
    var trip = await assignmentFor(partner, Number(req.body.assignment_id) || 0, [1, 2, 3]);
    if (!trip) {
        upload.removeStored(upload.publicPath(req.file));
        return db.refuse(res, 'That delivery is not on your account.');
    }

    var url = upload.publicPath(req.file);
    await db.query('UPDATE delivery_assignments SET proof_photo = ? WHERE id = ?', [url, trip.id], 'proof-save');
    upload.removeStored(trip.proof_photo); // a retaken photo replaces the old file

    return res.json({ status: 200, message: 'Proof photo saved', photo: url });
});
