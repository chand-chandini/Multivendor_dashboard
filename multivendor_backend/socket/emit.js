// Centralised emit helpers — the ONLY way controllers should publish socket
// events. Keeps room naming consistent and avoids leaking the io instance
// across the codebase.
//
// Usage from a controller (after the DB write succeeds):
//
//   var emit = require('../../socket/emit');
//   emit.toEvent(eventId, 'gift:created', { record_id: giftId, parent_id: eventId, actor_id, at: Date.now() });
//
// All methods are no-ops until socket/index.js has called _attach(io).

var io = null;

exports._attach = function (server) { io = server; };

function roomEmit(room, name, payload) {
    if (!io || !room) return;
    io.to(room).emit(name, payload || {});
    // Visible diagnostics — number of sockets that received the broadcast.
    // Async fetch room membership; non-blocking.
    if (process.env.SOCKET_VERBOSE !== '0') {
        io.in(room).fetchSockets().then(function (sockets) {
            console.log('[socket emit] ' + name + ' → ' + room + ' (' + (sockets ? sockets.length : 0) + ' listener' + ((sockets && sockets.length === 1) ? '' : 's') + ')');
        }).catch(function () {});
    }
}

// ---- Room targeting --------------------------------------------------------

/** Broadcast to every member of an event. */
exports.toEvent = function (eventId, name, payload) {
    if (eventId == null || eventId === '') return;
    roomEmit('event:' + eventId, name, payload);
};

/** Broadcast to only the hosts/co-hosts of an event (approval-queue counters). */
exports.toEventHosts = function (eventId, name, payload) {
    if (eventId == null || eventId === '') return;
    roomEmit('event:' + eventId + ':host', name, payload);
};

/** Broadcast to a sub-activity room (gift / twinning / performance / post / poll). */
exports.toSubActivity = function (module, id, name, payload) {
    if (!module || id == null || id === '') return;
    roomEmit(module + ':' + id, name, payload);
};

exports.toGift = function (giftId, name, payload) { exports.toSubActivity('gift', giftId, name, payload); };
exports.toTwinning = function (id, name, payload) { exports.toSubActivity('twinning', id, name, payload); };
exports.toPerformance = function (id, name, payload) { exports.toSubActivity('performance', id, name, payload); };
exports.toPost = function (id, name, payload) { exports.toSubActivity('post', id, name, payload); };
exports.toPoll = function (id, name, payload) { exports.toSubActivity('poll', id, name, payload); };

/** Direct to one or more users, across all their connected devices. */
exports.toUsers = function (userIds, name, payload) {
    if (!io || !userIds) return;
    var ids = (Array.isArray(userIds) ? userIds : [userIds])
        .map(function (x) { return (x == null ? '' : x).toString().trim(); })
        .filter(function (x) { return x && x !== '0'; });
    if (!ids.length) return;
    var rooms = ids.map(function (uid) { return 'user:' + uid; });
    io.to(rooms).emit(name, payload || {});
};

/** Catalog / banner broadcast — every connected socket including anons. */
exports.toAll = function (name, payload) { roomEmit('public:all', name, payload); };

/** Escape hatch — emit to an arbitrary room by name. Use sparingly. */
exports.toRoom = function (room, name, payload) { roomEmit(room, name, payload); };
