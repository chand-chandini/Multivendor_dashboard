// Partner App - "a new order came in" alert for the vendor.
//
// newOrder(orderId) is the single entry point. Call it wherever orders start
// existing — today nothing in this codebase creates an order (public_app is an
// empty router and dashboard_api only changes status), so the watcher below
// picks up rows as they appear, including ones written straight to MySQL. When
// the customer API is built, it should call newOrder(id) directly and the
// watcher stays as a safety net; `orders.vendor_notified_at` makes sure an
// order is announced exactly once either way.

var db = require('./db');
var fmt = require('./format');
var prefs = require('./prefs');
var push = require('./push');
var notifications = require('./notifications');

var WATCH_MS = Number(process.env.MV_PUSH_WATCH_MS || 5000);
var timer = null;

/**
 * Announces one order to its vendor: an in-app notification row (which the
 * bell shows) plus a push to that vendor's devices when FCM is configured.
 * Safe to call repeatedly — the stamp keeps it to once.
 */
async function newOrder(orderId) {
    var order = await db.one(
        'SELECT o.id, o.order_number, o.vendor_id, o.item_count, o.grand_total, o.payment_type, o.order_status, o.vendor_notified_at, ' +
        'v.tenant_id, v.vendor_name FROM orders o JOIN vendors v ON v.id = o.vendor_id ' +
        'WHERE o.id = ? AND o.d_in = 0', [orderId], 'alert-order');
    if (!order || order.vendor_notified_at || Number(order.order_status) !== 0) return { sent: 0, reason: 'not-new' };

    // Claim it first: two callers at once still produce one alert.
    var claim = await db.query('UPDATE orders SET vendor_notified_at = NOW() WHERE id = ? AND vendor_notified_at IS NULL',
        [order.id], 'alert-claim');
    if (!claim.affectedRows) return { sent: 0, reason: 'already-sent' };

    var items = fmt.num(order.item_count) || 1;
    var body = items + (items === 1 ? ' item · ' : ' items · ') + fmt.inr(order.grand_total) +
        ' · ' + (order.payment_type === 'cod' ? 'Cash on delivery' : 'Prepaid');

    await notifications.send(order.tenant_id, 'vendor', order.vendor_id,
        'New order ' + (order.order_number ? '#' + order.order_number : ''), body, 'order');

    var settings = await prefs.load('vendor', order.vendor_id);
    if (!settings.alerts) return { sent: 0, reason: 'alerts-off' };

    // Nothing about the customer goes into the payload.
    var result = await push.notify('vendor', order.vendor_id, {
        title: 'New order ' + (order.order_number ? '#' + order.order_number : ''),
        body: body,
        tag: 'order-' + order.id,
        data: {
            type: 'new_order',
            orderId: String(order.id),
            orderNumber: String(order.order_number || ''),
            vendorId: String(order.vendor_id)
        }
    });
    return result;
}

/** One pass: every placed order this vendor has not been told about yet. */
async function sweep() {
    var rows = await db.query(
        'SELECT id FROM orders WHERE order_status = 0 AND d_in = 0 AND vendor_notified_at IS NULL ' +
        'AND order_date_time >= NOW() - INTERVAL 1 DAY ORDER BY id LIMIT 20', [], 'alert-sweep');
    for (var i = 0; i < rows.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await newOrder(rows[i].id);
    }
    return rows.length;
}

/**
 * Watches for orders written by anything that does not call newOrder() itself.
 * MV_PUSH_WATCH_MS=0 turns it off.
 */
function startWatching() {
    if (timer || !(WATCH_MS > 0)) return;
    timer = setInterval(function () {
        sweep().catch(function (err) { console.error('[partner_app] new-order sweep', err && err.message); });
    }, WATCH_MS);
    if (timer.unref) timer.unref();
    console.log('[partner_app] watching for new orders every ' + WATCH_MS + 'ms' +
        (push.isConfigured() ? '' : ' (push not configured — in-app notifications only)'));
}

function stopWatching() {
    if (timer) clearInterval(timer);
    timer = null;
}

module.exports = { newOrder: newOrder, sweep: sweep, startWatching: startWatching, stopWatching: stopWatching };
