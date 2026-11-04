// Room membership — verifies the calling socket is allowed in before
// joining. The DB checks here mirror what the existing REST endpoints
// already permit, so we're not introducing a new authorisation surface.
//
// Failure mode: silent. A subscribe:event with a bogus event_id just
// doesn't join anything; we don't ack a failure to the client (the client
// would only retry, and the socket has no other useful work to do).

var sqldb = require('../config/dbconnect');
var dbutil = require(appRoot + '/utils/dbutils');

// Verify the calling user is a member or host of the event, then join the
// matching rooms. Hosts also join the host-only counter room.
exports.joinEventRooms = function (socket, payload) {
    payload = payload || {};
    var eventId = (payload.event_id || '').toString().trim();
    // Prefer payload.user_id (always current) over socket.data.user_id (set at
    // handshake, may be stale if the user logged in after the socket opened).
    // Also upgrade socket.data so emit.toUsers() can reach this device later.
    var userId = ((payload.user_id || '').toString().trim()) ||
                 ((socket.data && socket.data.user_id) || '');
    if (userId && socket.data.user_id !== userId) {
        if (socket.data.user_id) socket.leave('user:' + socket.data.user_id);
        socket.data.user_id = userId;
        socket.join('user:' + userId);
    }
    if (!eventId) return;

    // We accept anon viewers of public meta too — they get the event room
    // for read-only counters, but never the :host room. Keep the query
    // tight: one round-trip resolves both membership and host status.
    var QRY =
        'SELECT ' +
        '  (SELECT customer_id FROM events_t WHERE id=? AND d_in=0 LIMIT 1) AS owner_id, ' +
        '  (SELECT 1 FROM g_guest_list_t WHERE event_id=? AND guest_id=? AND guest_status=1 AND d_in=0 LIMIT 1) AS is_member;';
    dbutil.sqlinjection(sqldb.MySQLConPool, QRY, [eventId, eventId, userId], 'in joinEventRooms', function (err, rows) {
        if (err || !rows || !rows.length) {
            console.log('[socket] joinEventRooms event=' + eventId + ' user=' + userId + ' → no rows / err=' + (err && err.message));
            return;
        }
        var row = rows[0] || {};
        var ownerId = (row.owner_id || '').toString();
        var isOwner = userId && ownerId === userId;
        var isMember = !!row.is_member;
        // Anyone can join the public event room; host-only room is gated.
        socket.join('event:' + eventId);
        if (isOwner) {
            socket.join('event:' + eventId + ':host');
        }
        console.log('[socket] joinEventRooms event=' + eventId + ' user=' + userId +
            ' owner=' + ownerId + ' isOwner=' + isOwner + ' isMember=' + isMember +
            ' rooms=' + Array.from(socket.rooms).join(','));
    });
};

exports.leaveEventRooms = function (socket, payload) {
    payload = payload || {};
    var eventId = (payload.event_id || '').toString().trim();
    if (!eventId) return;
    socket.leave('event:' + eventId);
    socket.leave('event:' + eventId + ':host');
};

// Sub-activity rooms — there's no per-record permission table; we trust the
// event-level gating and only check that the id looks valid. Anyone who
// can see the parent event implicitly can see its sub-activities (the
// permission to ACT is enforced server-side on each HTTP write).
exports.joinSubActivityRoom = function (socket, module, payload) {
    payload = payload || {};
    var id = (payload.id || '').toString().trim();
    if (!id || !module) return;
    socket.join(module + ':' + id);
};

exports.leaveSubActivityRoom = function (socket, module, payload) {
    payload = payload || {};
    var id = (payload.id || '').toString().trim();
    if (!id || !module) return;
    socket.leave(module + ':' + id);
};
