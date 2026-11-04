// Partner App - order_status_history rows for status changes made from the app.

var db = require('./db');

/** byType: 'vendor' or 'delivery_partner'. */
module.exports = function record(orderId, oldStatus, newStatus, byType, byId, remarks) {
    return db.query(
        'INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_type, changed_by_id, remarks, i_ts, d_in) VALUES (?,?,?,?,?,?,NOW(),0)',
        [orderId, oldStatus, newStatus, byType, byId, remarks || null], 'order-history');
};
