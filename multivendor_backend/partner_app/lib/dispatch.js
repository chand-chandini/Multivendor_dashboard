// Partner App - keeps a delivery partner's assignments in step with the orders behind them, and
// hands a free partner the orders that are still waiting for one.
//
// An order is changed from three places: the vendor app, the delivery app and the admin dashboard.
// The first two also move the delivery_assignments row; the dashboard only writes orders, so a status
// set there never reached the partner's Requests or Active screens (DA-002). And offers are made once,
// when the store accepts or marks the order ready, to the three nearest partners; a partner who comes
// free later (after a delivery, a failed delivery, or by going online) was never offered what was
// still waiting (DA-004).
//
// Both run when a partner's state is read, so they cover every writer, not just the ones we know of.
//
// orders.order_status: 0 placed · 1 accepted · 2 preparing · 3 out_for_delivery · 4 delivered · 5 cancelled · 6 rejected · 7 ready
// delivery_assignments.assignment_status: 0 offered · 1 accepted · 2 picked_up · 3 delivered · 4 rejected · 5 cancelled

var db = require('./db');
var fmt = require('./format');
var notifications = require('./notifications');

/** Share of the base pay a partner keeps for a trip that ends without a delivery. */
var FAILED_PAY_SHARE = 0.35;
/** The most open requests one partner holds at a time. */
var MAX_OPEN_OFFERS = 3;
/** A waiting order further from the partner than this is left for someone nearer. */
var MAX_OFFER_KM = 15;
/** An order that has been waiting longer than this is stale, not something to send a partner to. */
var MAX_ORDER_AGE_HOURS = 24;

function notify(partner, title, body) {
    return notifications.send(partner.tenant_id, 'delivery_partner', partner.id, title, body).catch(function () { /* a missed note must not undo the change */ });
}

/**
 * Brings this partner's open assignments (offered, accepted, picked up) in line with their orders.
 * Returns how many assignments changed.
 */
async function reconcile(partner) {
    var rows = await db.query(
        'SELECT da.id, da.assignment_status, o.order_number, o.order_status, o.cancellation_reason, o.delivered_at, o.picked_up_at ' +
        'FROM delivery_assignments da JOIN orders o ON o.id = da.order_id ' +
        'WHERE da.delivery_partner_id = ? AND da.d_in = 0 AND da.assignment_status IN (0,1,2) AND o.order_status IN (3,4,5,6)',
        [partner.id], 'reconcile-find');

    var changed = 0;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var was = Number(row.assignment_status);
        var order = Number(row.order_status);
        var tag = '#' + (row.order_number || row.id);
        var result;

        if (order === 5 || order === 6) {
            // Cancelled or rejected. Before pickup nothing was delivered and nothing is paid; after pickup the
            // partner keeps the same share as for a delivery that failed at the door.
            var reason = 'Order cancelled' + (row.cancellation_reason ? ' · ' + row.cancellation_reason : '');
            // assignment_status is set last: the expressions before it still read the old value.
            result = await db.query(
                'UPDATE delivery_assignments SET ' +
                'base_pay = CASE assignment_status WHEN 2 THEN ROUND(base_pay * ?) WHEN 1 THEN 0 ELSE base_pay END, ' +
                'distance_pay = IF(assignment_status IN (1,2), 0, distance_pay), ' +
                'tip_pay = IF(assignment_status IN (1,2), 0, tip_pay), ' +
                'failure_reason = COALESCE(failure_reason, ?), ' +
                'delivered_at = IF(assignment_status IN (1,2), NOW(), delivered_at), ' +
                'assignment_status = 5 ' +
                'WHERE id = ? AND assignment_status = ?',
                [FAILED_PAY_SHARE, reason, row.id, was], 'reconcile-cancel');
            if (result.affectedRows && was > 0) {
                await notify(partner, 'Order cancelled · ' + tag, 'This order was cancelled' + (row.cancellation_reason ? ': ' + row.cancellation_reason : '.'));
            }
        } else if (order === 4 && was > 0) {
            // Marked delivered while the trip was still open: it closes as delivered, at the order's own time.
            result = await db.query(
                'UPDATE delivery_assignments SET picked_up_at = COALESCE(picked_up_at, ?), arrived_store_at = COALESCE(arrived_store_at, NOW()), ' +
                'arrived_customer_at = COALESCE(arrived_customer_at, NOW()), delivered_at = ?, assignment_status = 3 ' +
                'WHERE id = ? AND assignment_status = ?',
                [row.delivered_at || new Date(), row.delivered_at || new Date(), row.id, was], 'reconcile-delivered');
            if (result.affectedRows) await notify(partner, 'Order delivered · ' + tag, 'This order was marked delivered.');
        } else if (order === 3 && was === 1) {
            result = await db.query(
                'UPDATE delivery_assignments SET arrived_store_at = COALESCE(arrived_store_at, NOW()), picked_up_at = COALESCE(?, NOW()), assignment_status = 2 ' +
                'WHERE id = ? AND assignment_status = 1',
                [row.picked_up_at || null, row.id], 'reconcile-pickup');
            if (result.affectedRows) await notify(partner, 'Order picked up · ' + tag, 'This order was marked as picked up from the store.');
        } else if (was === 0) {
            // An offer for an order that has left the store or ended: nobody can accept it any more.
            result = await db.query('UPDATE delivery_assignments SET assignment_status = 5 WHERE id = ? AND assignment_status = 0', [row.id], 'reconcile-offer');
        } else {
            result = { affectedRows: 0 };
        }
        changed += result.affectedRows ? 1 : 0;
    }
    return changed;
}

/**
 * Offers this partner the orders that are waiting for one: accepted, preparing or ready, with no partner holding
 * or being offered them. Only an online, free partner is offered anything, nothing they already skipped or
 * failed, nearest first, up to MAX_OPEN_OFFERS open requests. Returns how many offers were made.
 */
async function offerWaitingOrders(partner) {
    if (Number(partner.is_online) !== 1 || Number(partner.active_status) !== 1 || Number(partner.login_status) !== 0) return 0;

    var busy = await db.one('SELECT id FROM delivery_assignments WHERE delivery_partner_id = ? AND assignment_status IN (1,2) AND d_in = 0 LIMIT 1',
        [partner.id], 'dispatch-busy');
    if (busy) return 0;

    var open = await db.one(
        'SELECT COUNT(*) AS n FROM delivery_assignments da JOIN orders o ON o.id = da.order_id ' +
        'WHERE da.delivery_partner_id = ? AND da.d_in = 0 AND da.assignment_status = 0 AND o.order_status IN (1,2,7)', [partner.id], 'dispatch-open');
    var room = MAX_OPEN_OFFERS - fmt.num(open && open.n);
    if (room <= 0) return 0;

    var waiting = await db.query(
        'SELECT o.id, o.order_number, o.customer_address_id, o.tip_amount, v.vendor_name, v.latitude AS v_lat, v.longitude AS v_lng ' +
        'FROM orders o JOIN vendors v ON v.id = o.vendor_id ' +
        'WHERE v.tenant_id = ? AND o.d_in = 0 AND o.order_status IN (1,2,7) AND o.order_date_time >= NOW() - INTERVAL ? HOUR ' +
        'AND NOT EXISTS (SELECT 1 FROM delivery_assignments x WHERE x.order_id = o.id AND x.d_in = 0 AND x.assignment_status IN (0,1,2,3)) ' +
        'AND NOT EXISTS (SELECT 1 FROM delivery_assignments y WHERE y.order_id = o.id AND y.d_in = 0 AND y.delivery_partner_id = ?) ' +
        'ORDER BY o.order_date_time, o.id LIMIT 20', [partner.tenant_id, MAX_ORDER_AGE_HOURS, partner.id], 'dispatch-waiting');

    var withDistance = waiting.map(function (o) {
        return { order: o, km: fmt.km(partner.latitude, partner.longitude, o.v_lat, o.v_lng) };
    }).filter(function (w) {
        // A distance of 0 means a position is missing on one side: not enough to rule the order out.
        return w.km <= MAX_OFFER_KM;
    });
    withDistance.sort(function (a, b) { return a.km - b.km; });

    var made = 0;
    for (var i = 0; i < withDistance.length && made < room; i++) {
        var order = withDistance[i].order;
        var address = order.customer_address_id
            ? await db.one('SELECT latitude, longitude FROM customer_addresses WHERE id = ?', [order.customer_address_id], 'dispatch-address') : null;
        var dropKm = address ? fmt.km(order.v_lat, order.v_lng, address.latitude, address.longitude) : 3;
        // The same pay and the same guard as the store's own offer: nothing is added if another request came first.
        var result = await db.query(
            'INSERT INTO delivery_assignments (order_id, delivery_partner_id, assigned_at, assignment_status, distance_km, base_pay, distance_pay, tip_pay, i_ts, d_in) ' +
            'SELECT ?, ?, NOW(), 0, ?, 40, ?, ?, NOW(), 0 FROM DUAL ' +
            'WHERE NOT EXISTS (SELECT 1 FROM delivery_assignments WHERE order_id = ? AND assignment_status IN (0,1,2,3) AND d_in = 0)',
            [order.id, partner.id, dropKm || 1, Math.round((dropKm || 1) * 3), fmt.num(order.tip_amount), order.id], 'dispatch-offer');
        if (result.affectedRows) {
            made += 1;
            await notify(partner, 'New request · ' + order.vendor_name, '#' + order.order_number + ' · ' + dropKm + ' km drop');
        }
    }
    return made;
}

module.exports = { reconcile: reconcile, offerWaitingOrders: offerWaitingOrders, FAILED_PAY_SHARE: FAILED_PAY_SHARE, MAX_OPEN_OFFERS: MAX_OPEN_OFFERS, MAX_OFFER_KM: MAX_OFFER_KM, MAX_ORDER_AGE_HOURS: MAX_ORDER_AGE_HOURS };
