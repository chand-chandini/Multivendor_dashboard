// Partner App - franchise workspace (an area franchisee overseeing vendors and delivery partners).
// GET /getfranchisestate returns everything the franchise screens render; each action
// returns { status, message } and the app refetches the state.
//
// Scope: a franchise sees only the vendors and delivery partners whose franchise_id is
// its own id, and the orders placed with those vendors. Nothing here writes to orders.
//
// Earnings: franchises.commission_percentage of the sub_total of each delivered order
// from the franchise's vendors, credited on the day the order was delivered.

var db = require('../lib/db');
var fmt = require('../lib/format');
var branding = require('../lib/branding');

var DELIVERED = 4;
var LIVE_STATUSES = [0, 1, 2, 7, 3];
var WEEKS = 6;

async function franchiseFor(req) {
    return db.one('SELECT * FROM franchises WHERE id = ? AND tenant_id = ? AND d_in = 0', [req.partner.id, req.partner.tenant_id], 'franchise-self');
}

function withFranchise(fn) {
    return db.handle(async function (req, res) {
        var franchise = await franchiseFor(req);
        if (!franchise) return res.status(401).json({ status: 401, message: 'Franchise account not found' });
        return fn(req, res, franchise);
    });
}

function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

/** Monday on or before d. */
function weekStart(d) {
    var x = startOfDay(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
}

function sqlDate(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' 00:00:00';
}

/** pct percent of amount, to the paisa. */
function share(amount, pct) {
    return Math.round(fmt.num(amount) * fmt.num(pct)) / 100;
}

async function vendorsOf(franchise, since) {
    var midnight = sqlDate(startOfDay(new Date()));
    return db.query(
        'SELECT v.id, v.vendor_name, v.vendor_mobile_number, v.store_category, v.is_online, v.login_status, v.vendor_rating, v.kyc_status, ' +
        'l.area AS location_area, v.vendor_address, ' +
        'COALESCE(SUM(o.order_status = ? AND o.delivered_at >= ?), 0) AS delivered_today, ' +
        'COALESCE(SUM(CASE WHEN o.order_status = ? AND o.delivered_at >= ? THEN o.sub_total ELSE 0 END), 0) AS sales_today, ' +
        'COALESCE(SUM(o.order_status IN (?)), 0) AS open_orders, ' +
        'COALESCE(SUM(o.order_status = ? AND o.delivered_at >= ?), 0) AS delivered_30d, ' +
        'COALESCE(SUM(CASE WHEN o.order_status = ? AND o.delivered_at >= ? THEN o.sub_total ELSE 0 END), 0) AS sales_30d, ' +
        'COALESCE(SUM(o.order_status IN (5,6) AND o.i_ts >= ?), 0) AS cancelled_30d, ' +
        'COALESCE(SUM(CASE WHEN o.order_status IN (5,6) AND o.i_ts >= ? THEN o.sub_total ELSE 0 END), 0) AS lost_30d ' +
        'FROM vendors v LEFT JOIN locations l ON l.id = v.location_id ' +
        'LEFT JOIN orders o ON o.vendor_id = v.id AND o.d_in = 0 ' +
        'WHERE v.franchise_id = ? AND v.d_in = 0 GROUP BY v.id ORDER BY v.vendor_name',
        [DELIVERED, midnight, DELIVERED, midnight, LIVE_STATUSES, DELIVERED, since, DELIVERED, since, since, since, franchise.id], 'franchise-vendors');
}

async function partnersOf(franchise) {
    return db.query(
        'SELECT dp.id, dp.name, dp.mobile_number, dp.vehicle_type, dp.vehicle_number, dp.rating, dp.is_online, dp.login_status, dp.kyc_status, ' +
        'COALESCE(SUM(da.assignment_status = 3 AND da.delivered_at >= ?), 0) AS trips_today, ' +
        'COALESCE(SUM(da.assignment_status IN (1,2)), 0) AS on_trip, ' +
        'COALESCE(SUM(da.assignment_status = 3), 0) AS trips_total ' +
        'FROM delivery_partners dp LEFT JOIN delivery_assignments da ON da.delivery_partner_id = dp.id AND da.d_in = 0 ' +
        'WHERE dp.franchise_id = ? AND dp.d_in = 0 GROUP BY dp.id ORDER BY dp.name',
        [sqlDate(startOfDay(new Date())), franchise.id], 'franchise-partners');
}

function vendorJson(v, pct) {
    return {
        id: String(v.id),
        name: v.vendor_name,
        mobile: v.vendor_mobile_number,
        category: fmt.category(v.store_category),
        area: v.location_area || fmt.areaFrom(v.vendor_address),
        online: Number(v.is_online) === 1,
        blocked: Number(v.login_status) === 1,
        kycVerified: Number(v.kyc_status) === 1,
        rating: fmt.num(v.vendor_rating, 4),
        openOrders: fmt.num(v.open_orders),
        ordersToday: fmt.num(v.delivered_today),
        salesToday: Math.round(fmt.num(v.sales_today)),
        orders30d: fmt.num(v.delivered_30d),
        sales30d: Math.round(fmt.num(v.sales_30d)),
        earned30d: Math.round(share(v.sales_30d, pct)),
        cancelled30d: fmt.num(v.cancelled_30d),
        lostSales30d: Math.round(fmt.num(v.lost_30d))
    };
}

function partnerJson(p) {
    return {
        id: String(p.id),
        name: p.name,
        mobile: p.mobile_number,
        vehicle: [p.vehicle_type, p.vehicle_number].filter(Boolean).join(' · '),
        online: Number(p.is_online) === 1,
        blocked: Number(p.login_status) === 1,
        kycVerified: Number(p.kyc_status) === 1,
        rating: fmt.num(p.rating, 4),
        onTrip: fmt.num(p.on_trip) > 0,
        tripsToday: fmt.num(p.trips_today),
        tripsTotal: fmt.num(p.trips_total)
    };
}

// GET /getfranchisestate
exports.getfranchisestate = withFranchise(async function (req, res, franchise) {
    var today = startOfDay(new Date());
    var month = new Date(today);
    month.setDate(month.getDate() - 29);
    var weeksFrom = weekStart(today);
    weeksFrom.setDate(weeksFrom.getDate() - 7 * (WEEKS - 1));
    var pct = fmt.num(franchise.commission_percentage);

    var vendors = (await vendorsOf(franchise, sqlDate(month))).map(function (v) { return vendorJson(v, pct); });
    var partners = (await partnersOf(franchise)).map(partnerJson);

    var recent = await db.query(
        'SELECT DATE(o.delivered_at) AS day, COUNT(*) AS orders, SUM(o.sub_total) AS sales FROM orders o JOIN vendors v ON v.id = o.vendor_id ' +
        'WHERE v.franchise_id = ? AND o.order_status = ? AND o.d_in = 0 AND o.delivered_at >= ? GROUP BY DATE(o.delivered_at)',
        [franchise.id, DELIVERED, sqlDate(weeksFrom)], 'franchise-daily');

    var byDay = {};
    recent.forEach(function (r) { byDay[new Date(r.day).toDateString()] = r; });
    var dayValue = function (d) { return byDay[d.toDateString()] || { orders: 0, sales: 0 }; };

    // Last 7 days, oldest first, for the home chart.
    var days = [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var v = dayValue(d);
        days.push({ label: fmt.dayName(d), orders: fmt.num(v.orders), sales: Math.round(fmt.num(v.sales)), earned: Math.round(share(v.sales, pct)) });
    }

    // Weekly statements, newest first.
    var weeks = [];
    for (var w = 0; w < WEEKS; w++) {
        var start = weekStart(today);
        start.setDate(start.getDate() - 7 * w);
        var end = new Date(start);
        end.setDate(end.getDate() + 6);
        var orders = 0;
        var sales = 0;
        for (var k = 0; k < 7; k++) {
            var day = new Date(start);
            day.setDate(day.getDate() + k);
            var dv = dayValue(day);
            orders += fmt.num(dv.orders);
            sales += fmt.num(dv.sales);
        }
        weeks.push({
            id: sqlDate(start).slice(0, 10),
            label: fmt.rangeLabel(start, end),
            current: w === 0,
            orders: orders,
            sales: Math.round(sales),
            earned: Math.round(share(sales, pct))
        });
    }

    var todayV = dayValue(today);
    var live = await db.one(
        'SELECT COUNT(*) AS n FROM orders o JOIN vendors v ON v.id = o.vendor_id WHERE v.franchise_id = ? AND o.d_in = 0 AND o.order_status IN (?)',
        [franchise.id, LIVE_STATUSES], 'franchise-live');
    var cancelled = await db.one(
        'SELECT COUNT(*) AS n FROM orders o JOIN vendors v ON v.id = o.vendor_id WHERE v.franchise_id = ? AND o.d_in = 0 AND o.order_status IN (5,6) AND o.i_ts >= ?',
        [franchise.id, sqlDate(month)], 'franchise-cancelled');
    var sales30 = vendors.reduce(function (s, x) { return s + x.sales30d; }, 0);

    return res.json({
        status: 200,
        data: {
            profile: {
                name: franchise.franchise_name,
                owner: franchise.owner_name,
                initials: fmt.initials(franchise.franchise_name),
                code: franchise.franchise_code,
                mobile: franchise.mobile_number,
                email: franchise.email || '',
                territory: franchise.territory_name || '',
                area: [franchise.area, franchise.city].filter(Boolean).join(', '),
                commissionPct: pct,
                bank: fmt.bankLabel(franchise.bank_name, franchise.bank_account_number, franchise.bank_ifsc_code)
            },
            today: {
                orders: fmt.num(todayV.orders),
                sales: Math.round(fmt.num(todayV.sales)),
                earned: Math.round(share(todayV.sales, pct)),
                liveOrders: fmt.num(live.n),
                vendorsOnline: vendors.filter(function (x) { return x.online; }).length,
                partnersOnline: partners.filter(function (x) { return x.online; }).length
            },
            month: {
                orders: vendors.reduce(function (s, x) { return s + x.orders30d; }, 0),
                sales: sales30,
                earned: Math.round(share(sales30, pct)),
                cancelled: fmt.num(cancelled.n)
            },
            days: days,
            weeks: weeks,
            vendors: vendors,
            partners: partners,
            branding: await branding.load(franchise.tenant_id)
        }
    });
});

/** 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm' (also with a T). A bare date means the whole day. */
function parseMoment(text, endOfDay) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(String(text || ''));
    if (!m) return null;
    var timed = m[4] !== undefined;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), timed ? Number(m[4]) : 0, timed ? Number(m[5]) : 0);
    if (d.getMonth() !== Number(m[2]) - 1) return null;
    // End is exclusive: a bare date runs to the end of that day, a timed one to the end of that minute.
    if (endOfDay) d.setMinutes(d.getMinutes() + (timed ? 1 : 24 * 60));
    return d;
}

function sqlMoment(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return sqlDate(d).slice(0, 10) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':00';
}

// GET /franchise/vendorreport?from=&to=[&vendor_id=]  (dates as YYYY-MM-DD or YYYY-MM-DD HH:mm)
// Per vendor, over the chosen days: delivered orders and sales, the franchise's commission on
// them (benefit), and the cancelled or rejected orders placed in the period and their value (loss).
exports.vendorreport = withFranchise(async function (req, res, franchise) {
    var from = parseMoment(req.query.from, false);
    var end = parseMoment(req.query.to, true);
    if (!from || !end || from >= end) return db.refuse(res, 'Choose a valid From and To date and time.');
    var pct = fmt.num(franchise.commission_percentage);
    var a = sqlMoment(from);
    var b = sqlMoment(end);
    var only = Number(req.query.vendor_id) || 0;

    var rows = await db.query(
        'SELECT v.id, v.vendor_name, ' +
        'COALESCE(SUM(o.order_status = ? AND o.delivered_at >= ? AND o.delivered_at < ?), 0) AS delivered, ' +
        'COALESCE(SUM(CASE WHEN o.order_status = ? AND o.delivered_at >= ? AND o.delivered_at < ? THEN o.sub_total ELSE 0 END), 0) AS sales, ' +
        'COALESCE(SUM(o.order_status IN (5,6) AND o.i_ts >= ? AND o.i_ts < ?), 0) AS cancelled, ' +
        'COALESCE(SUM(CASE WHEN o.order_status IN (5,6) AND o.i_ts >= ? AND o.i_ts < ? THEN o.sub_total ELSE 0 END), 0) AS lost ' +
        'FROM vendors v LEFT JOIN orders o ON o.vendor_id = v.id AND o.d_in = 0 ' +
        'WHERE v.franchise_id = ? AND v.d_in = 0' + (only ? ' AND v.id = ?' : '') + ' GROUP BY v.id ORDER BY v.vendor_name',
        [DELIVERED, a, b, DELIVERED, a, b, a, b, a, b, franchise.id].concat(only ? [only] : []), 'franchise-vendorreport');

    var vendors = rows.map(function (r) {
        return {
            id: String(r.id),
            name: r.vendor_name,
            orders: fmt.num(r.delivered),
            sales: Math.round(fmt.num(r.sales)),
            earned: Math.round(share(r.sales, pct)),
            cancelled: fmt.num(r.cancelled),
            lostSales: Math.round(fmt.num(r.lost))
        };
    });
    var total = vendors.reduce(function (t, v) {
        return { orders: t.orders + v.orders, sales: t.sales + v.sales, earned: t.earned + v.earned, cancelled: t.cancelled + v.cancelled, lostSales: t.lostSales + v.lostSales };
    }, { orders: 0, sales: 0, earned: 0, cancelled: 0, lostSales: 0 });

    return res.json({ status: 200, data: { from: req.query.from, to: req.query.to, commissionPct: pct, vendors: vendors, total: total } });
});

function isoOf(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

var ASSIGNMENT_LABEL = { 3: 'delivered', 5: 'failed' };

// GET /franchise/vendor?id=
// Everything about one vendor of this franchise: contact, store, licences, payout account
// (masked), lifetime order totals with the franchise's commission, and the latest orders.
exports.vendordetail = withFranchise(async function (req, res, franchise) {
    var id = Number(req.query.id) || 0;
    var v = await db.one(
        'SELECT v.*, l.area AS location_area, l.city AS location_city FROM vendors v LEFT JOIN locations l ON l.id = v.location_id ' +
        'WHERE v.id = ? AND v.franchise_id = ? AND v.d_in = 0', [id, franchise.id], 'franchise-vendor-detail');
    if (!v) return db.refuse(res, "That vendor isn't in your franchise.");

    var t = await db.one(
        'SELECT COUNT(*) AS orders, ' +
        'COALESCE(SUM(order_status = ?), 0) AS delivered, ' +
        'COALESCE(SUM(order_status = 5), 0) AS cancelled, ' +
        'COALESCE(SUM(order_status = 6), 0) AS rejected, ' +
        'COALESCE(SUM(order_status IN (?)), 0) AS open_orders, ' +
        'COALESCE(SUM(accepted_at IS NOT NULL), 0) AS accepted, ' +
        'COALESCE(SUM(order_status IN (1,2,7,3)), 0) AS in_process, ' +
        'COALESCE(SUM(order_status = 0), 0) AS waiting, ' +
        'COALESCE(SUM(CASE WHEN order_status = ? THEN sub_total ELSE 0 END), 0) AS sales, ' +
        'COALESCE(SUM(CASE WHEN order_status IN (5,6) THEN sub_total ELSE 0 END), 0) AS lost ' +
        'FROM orders WHERE vendor_id = ? AND d_in = 0', [DELIVERED, LIVE_STATUSES, DELIVERED, id], 'franchise-vendor-totals');
    var recent = await db.query(
        'SELECT order_number, order_status, sub_total, grand_total, payment_type, i_ts, delivered_at FROM orders ' +
        'WHERE vendor_id = ? AND d_in = 0 ORDER BY id DESC LIMIT 10', [id], 'franchise-vendor-recent');
    var pct = fmt.num(franchise.commission_percentage);

    return res.json({
        status: 200,
        data: {
            id: String(v.id),
            name: v.vendor_name,
            code: v.vendor_unique_code || '',
            category: fmt.category(v.store_category),
            online: Number(v.is_online) === 1,
            busy: Number(v.is_busy) === 1,
            blocked: Number(v.login_status) === 1,
            kycVerified: Number(v.kyc_status) === 1,
            rating: fmt.num(v.vendor_rating, 4),
            mobile: v.vendor_mobile_number || '',
            mobile2: v.vendor_mobile_number2 || '',
            email: v.vendor_email || '',
            address: v.vendor_address || '',
            area: [v.location_area, v.location_city].filter(Boolean).join(', '),
            hours: fmt.hoursLabel(v.opening_time, v.closing_time),
            weeklyHoliday: v.weekly_holiday || '',
            platformCommissionPct: fmt.num(v.commission_percentage, 2),
            joined: isoOf(v.i_ts),
            licences: {
                fssai: v.fssai_license_number || '',
                gst: v.gst_number || '',
                trade: v.trade_license_number || '',
                drug: v.drug_license_number || '',
                pan: fmt.pan(v.pan_number)
            },
            bank: {
                holder: v.bank_account_holder || '',
                bank: v.bank_name || '',
                account: fmt.masked(v.bank_account_number),
                ifsc: v.bank_ifsc_code || '',
                upi: v.upi_id || ''
            },
            totals: {
                orders: fmt.num(t.orders),
                delivered: fmt.num(t.delivered),
                cancelled: fmt.num(t.cancelled),
                rejected: fmt.num(t.rejected),
                open: fmt.num(t.open_orders),
                // accepted counts every order the vendor said yes to, including those since delivered or cancelled.
                accepted: fmt.num(t.accepted),
                inProcess: fmt.num(t.in_process),
                waiting: fmt.num(t.waiting),
                sales: Math.round(fmt.num(t.sales)),
                earned: Math.round(share(t.sales, pct)),
                lostSales: Math.round(fmt.num(t.lost))
            },
            recent: recent.map(function (o) {
                return {
                    number: o.order_number,
                    status: fmt.orderStatus(o.order_status),
                    amount: Math.round(fmt.num(o.grand_total)),
                    payment: o.payment_type || '',
                    placedAt: isoOf(o.i_ts),
                    deliveredAt: isoOf(o.delivered_at)
                };
            })
        }
    });
});

// GET /franchise/partner?id=
// Everything about one delivery partner of this franchise: contact, vehicle, documents and
// payout account (masked), lifetime delivery totals and pay, and the latest deliveries.
exports.partnerdetail = withFranchise(async function (req, res, franchise) {
    var id = Number(req.query.id) || 0;
    var p = await db.one(
        'SELECT dp.*, l.area AS location_area, l.city AS location_city FROM delivery_partners dp LEFT JOIN locations l ON l.id = dp.location_id ' +
        'WHERE dp.id = ? AND dp.franchise_id = ? AND dp.d_in = 0', [id, franchise.id], 'franchise-partner-detail');
    if (!p) return db.refuse(res, "That delivery partner isn't in your franchise.");

    var t = await db.one(
        'SELECT COALESCE(SUM(assignment_status = 3), 0) AS delivered, ' +
        'COALESCE(SUM(assignment_status = 3 AND delivered_at >= ?), 0) AS today, ' +
        'COALESCE(SUM(assignment_status = 5), 0) AS failed, ' +
        'COALESCE(SUM(assignment_status IN (1,2)), 0) AS active, ' +
        'COALESCE(SUM(CASE WHEN assignment_status = 3 THEN distance_km ELSE 0 END), 0) AS km, ' +
        'COALESCE(SUM(CASE WHEN assignment_status = 3 THEN COALESCE(base_pay,0) + COALESCE(distance_pay,0) + COALESCE(tip_pay,0) ELSE 0 END), 0) AS pay ' +
        'FROM delivery_assignments WHERE delivery_partner_id = ? AND d_in = 0', [sqlDate(startOfDay(new Date())), id], 'franchise-partner-totals');
    var recent = await db.query(
        'SELECT o.order_number, da.assignment_status, da.distance_km, da.delivered_at, da.assigned_at, ' +
        'COALESCE(da.base_pay,0) + COALESCE(da.distance_pay,0) + COALESCE(da.tip_pay,0) AS pay ' +
        'FROM delivery_assignments da JOIN orders o ON o.id = da.order_id ' +
        'WHERE da.delivery_partner_id = ? AND da.d_in = 0 ORDER BY da.id DESC LIMIT 10', [id], 'franchise-partner-recent');

    return res.json({
        status: 200,
        data: {
            id: String(p.id),
            name: p.name,
            mobile: p.mobile_number || '',
            address: p.address || '',
            area: [p.location_area, p.location_city].filter(Boolean).join(', '),
            zone: p.zone_name || '',
            shift: p.shift_preference || '',
            vehicleType: p.vehicle_type || '',
            vehicleNumber: p.vehicle_number || '',
            online: Number(p.is_online) === 1,
            onlineSince: Number(p.is_online) === 1 ? isoOf(p.online_since) : null,
            blocked: Number(p.login_status) === 1,
            kycVerified: Number(p.kyc_status) === 1,
            rating: fmt.num(p.rating, 4),
            joined: isoOf(p.i_ts),
            documents: {
                aadhaar: fmt.aadhaar(p.aadhar_number),
                licence: p.driving_license_number || '',
                pan: fmt.pan(p.pan_number)
            },
            bank: { account: fmt.masked(p.bank_account_number), ifsc: p.bank_ifsc_code || '' },
            totals: {
                delivered: fmt.num(t.delivered),
                today: fmt.num(t.today),
                failed: fmt.num(t.failed),
                active: fmt.num(t.active),
                distanceKm: Math.round(fmt.num(t.km) * 10) / 10,
                pay: Math.round(fmt.num(t.pay))
            },
            recent: recent.map(function (r) {
                return {
                    number: r.order_number,
                    status: ASSIGNMENT_LABEL[Number(r.assignment_status)] || 'in_progress',
                    distanceKm: Math.round(fmt.num(r.distance_km) * 10) / 10,
                    pay: Math.round(fmt.num(r.pay)),
                    at: isoOf(r.delivered_at || r.assigned_at)
                };
            })
        }
    });
});

/** Shared by the two block/unblock actions: the row must belong to this franchise. */
async function setLogin(res, table, franchise, id, blocked, label) {
    var row = await db.one('SELECT id FROM ' + table + ' WHERE id = ? AND franchise_id = ? AND d_in = 0', [id, franchise.id], 'franchise-own-' + table);
    if (!row) return db.refuse(res, "That " + label + " isn't in your franchise.");
    await db.query('UPDATE ' + table + ' SET login_status = ? WHERE id = ?', [blocked ? 1 : 0, id], 'franchise-login-' + table);
    return res.json({ status: 200, message: label.charAt(0).toUpperCase() + label.slice(1) + (blocked ? ' blocked' : ' unblocked') });
}

// POST /franchise/setvendorblocked { id, blocked }
exports.setvendorblocked = withFranchise(function (req, res, franchise) {
    return setLogin(res, 'vendors', franchise, Number(req.body.id), !!req.body.blocked, 'vendor');
});

// POST /franchise/setpartnerblocked { id, blocked }
exports.setpartnerblocked = withFranchise(function (req, res, franchise) {
    return setLogin(res, 'delivery_partners', franchise, Number(req.body.id), !!req.body.blocked, 'delivery partner');
});
