var jwt = require('jsonwebtoken');
var axios = require('axios');

// Firebase Cloud Messaging, HTTP v1.
//
// Deliberately NOT firebase-admin: the whole job is "sign a JWT, swap it for an access
// token, POST a message", and jsonwebtoken + axios are already dependencies. Pulling in the
// admin SDK for this would add tens of megabytes to every deploy for three requests.
//
//
// Credentials come from the VPS .env and nowhere else:
//   FCM_PROJECT_ID    — same project as the app's google-services.json
//   FCM_CLIENT_EMAIL  — service account, Firebase Console → Project settings → Service accounts
//   FCM_PRIVATE_KEY   — that account's private key. Newlines may be written as \n.
// With any of them missing this module is a no-op that logs once, the same shape as s3.

var PROJECT_ID = process.env.FCM_PROJECT_ID || '';
var CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL || '';
// A .env cannot hold a real newline, so the key is stored with literal \n and unescaped here.
var PRIVATE_KEY = (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n');

exports.enabled = !!(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);

var cachedToken = null;
var cachedUntil = 0;

// Google's token is good for an hour; re-minting one per notification would add a round trip
// to every send. Refreshed five minutes early so a token never expires mid-flight.
async function accessToken() {
    var now = Math.floor(Date.now() / 1000);
    if (cachedToken && now < cachedUntil) return cachedToken;

    var assertion = jwt.sign({
        iss: CLIENT_EMAIL,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    }, PRIVATE_KEY, { algorithm: 'RS256' });

    var res = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    cachedToken = res.data.access_token;
    cachedUntil = now + (res.data.expires_in || 3600) - 300;
    return cachedToken;
}

// Send to ONE device token. Returns { ok, unregistered } — `unregistered` means the app was
// uninstalled or the token rotated, and the caller should stop storing it. Never throws: a
// notification failing must not take down the request that triggered it.
exports.sendTo = async function (deviceToken, msg) {
    if (!exports.enabled) return { ok: false, unregistered: false };
    try {
        var token = await accessToken();
        await axios.post(
            'https://fcm.googleapis.com/v1/projects/' + PROJECT_ID + '/messages:send',
            {
                message: {
                    token: deviceToken,
                    notification: { title: msg.title, body: msg.body },
                    // Strings only — FCM rejects a data payload with non-string values, and
                    // the app reads these to decide where to navigate on tap.
                    data: Object.keys(msg.data || {}).reduce(function (acc, k) {
                        acc[k] = String(msg.data[k]);
                        return acc;
                    }, {}),
                    // The channel id is a contract with the app's src/lib/push.js, which
                    // creates that channel at startup.
                    // `sound` is set because without it FCM builds the notification with
                    // sound=null, which is silent on a stock device.
                    android: {
                        priority: 'high',
                        notification: { channel_id: 'default', sound: 'default' }
                    }
                }
            },
            { headers: { Authorization: 'Bearer ' + token } });
        return { ok: true, unregistered: false };
    } catch (e) {
        var status = e.response && e.response.status;
        var code = e.response && e.response.data && e.response.data.error &&
            e.response.data.error.status;
        // Only 404 / UNREGISTERED retires a token. 400 INVALID_ARGUMENT is deliberately NOT
        // treated as dead: FCM returns it for a malformed PAYLOAD as well as a malformed
        // token, so trusting it would let one bad send deactivate every device we have.
        var dead = status === 404 || code === 'UNREGISTERED' || code === 'NOT_FOUND';
        console.warn('[fcm] send failed', status || e.message, code || '');
        return { ok: false, unregistered: dead };
    }
};
