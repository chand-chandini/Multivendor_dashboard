// Socket.IO server — real-time fan-out for public_app.
//
// Auth posture: matches the existing REST app, which accepts user_id from
// the request body without cryptographic validation. The handshake reads
// `user_id` (and optional `event_id`) from socket.handshake.auth and joins
// `user:<id>` + `public:all`. Membership-gated rooms (event:, gift:, etc.)
// are joined via explicit `subscribe:*` events, after the server verifies
// membership via the DB. When JWT lands across the app, swap the handshake
// reader for a verify step — no other call sites change.
//
// Single-node by design today. When we scale out, add
// `@socket.io/redis-adapter` here and reuse the existing ioredis pool —
// no other files need to change.

const { Server } = require('socket.io');
const rooms = require('./rooms');
const emit = require('./emit');

let io = null;

/**
 * Attach Socket.IO to the existing HTTP server. Idempotent — call once at
 * boot from api/app.js after http.createServer.
 *
 * @param {http.Server} httpServer  the same server Express listens on
 * @returns {import('socket.io').Server}
 */
exports.init = function (httpServer) {
    if (io) return io;
    io = new Server(httpServer, {
        // origin:'*' + credentials:true is a spec violation modern browsers
        // reject — keep wildcard origin (matches Express's CORS config) and
        // drop credentials, which we don't use (auth is in the handshake payload).
        cors: { origin: '*', methods: ['GET', 'POST'] },
        // Long-poll fallback stays on for older mobile webviews; websocket is
        // tried first by the client.
        transports: ['websocket', 'polling']
    });

    // Hand the live server to the emit helper so controllers can publish
    // without touching `io` directly.
    emit._attach(io);

    io.on('connection', function (socket) {
        const auth = socket.handshake.auth || {};
        const userId = (auth.user_id || '').toString().trim();

        // Bind identity to the socket so subscribe:* handlers can authorise
        // without re-reading handshake.
        socket.data.user_id = userId;

        // Always join the public catalog room (works for anon users too).
        socket.join('public:all');

        // Logged-in user gets a private room for direct messages /
        // notifications. Multi-device users share the same room.
        if (userId && userId !== '0') {
            socket.join('user:' + userId);
        }

        console.log('[socket] connect id=' + socket.id + ' user_id=' + (userId || '(anon)'));

        // Late login — the page reused an existing anonymous socket. Allow
        // the client to upgrade its identity at runtime without reconnecting.
        socket.on('auth:identify', function (payload) {
            var uid = (payload && payload.user_id || '').toString().trim();
            if (!uid || uid === '0' || uid === socket.data.user_id) return;
            if (socket.data.user_id) socket.leave('user:' + socket.data.user_id);
            socket.data.user_id = uid;
            socket.join('user:' + uid);
            console.log('[socket] ' + socket.id + ' identified as user_id=' + uid);
        });

        // Subscription requests — page-level. The room is joined only after
        // the membership check passes.
        socket.on('subscribe:event', function (payload) {
            rooms.joinEventRooms(socket, payload);
        });
        socket.on('unsubscribe:event', function (payload) {
            rooms.leaveEventRooms(socket, payload);
        });

        // Sub-activity rooms — looser checks (anyone who can see the parent
        // event sees these). The room name is the source of truth.
        ['gift', 'twinning', 'performance', 'post', 'poll'].forEach(function (mod) {
            socket.on('subscribe:' + mod, function (payload) {
                rooms.joinSubActivityRoom(socket, mod, payload);
            });
            socket.on('unsubscribe:' + mod, function (payload) {
                rooms.leaveSubActivityRoom(socket, mod, payload);
            });
        });

        // Diagnostic ping for client-side reconnection health checks.
        socket.on('ping:health', function (_, ack) {
            if (typeof ack === 'function') ack({ ok: true, at: Date.now() });
        });
    });

    return io;
};

exports.io = function () { return io; };
