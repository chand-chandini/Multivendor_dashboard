// Partner App - Firebase Cloud Messaging.
//
// Sends through FCM's HTTP v1 API, signed with a service account. No new
// dependency: the OAuth token is minted with `jsonwebtoken` and posted with
// `axios`, both of which the backend already uses.
//
// Credentials come from .env and never leave the server:
//   MV_FCM_PROJECT_ID    Firebase project id
//   MV_FCM_CLIENT_EMAIL  service-account email
//   MV_FCM_PRIVATE_KEY   its private key ("\n" escapes are fine)
//
// With none of them set, isConfigured() is false and every send is skipped —
// the app still gets its orders from the 15-second poll.

var axios = require('axios');
var jwt = require('jsonwebtoken');

var devices = require('./devices');

var TOKEN_URL = 'https://oauth2.googleapis.com/token';
var SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

/** The app has no alert sounds yet, so everything uses one default channel. */
var DEFAULT_CHANNEL = 'new_orders';

var cachedToken = null; // { value, expiresAt }

function config() {
    return {
        projectId: process.env.MV_FCM_PROJECT_ID,
        clientEmail: process.env.MV_FCM_CLIENT_EMAIL,
        privateKey: String(process.env.MV_FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    };
}

function isConfigured() {
    var c = config();
    return Boolean(c.projectId && c.clientEmail && c.privateKey);
}

/** Google OAuth access token for the service account, cached until it expires. */
async function accessToken() {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
    var c = config();
    var now = Math.floor(Date.now() / 1000);
    var assertion = jwt.sign(
        { iss: c.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 },
        c.privateKey,
        { algorithm: 'RS256' });
    var res = await axios.post(TOKEN_URL, new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 });
    cachedToken = { value: res.data.access_token, expiresAt: Date.now() + (res.data.expires_in || 3600) * 1000 };
    return cachedToken.value;
}

/**
 * Sends one message. Returns 'sent', 'skipped' (no credentials) or 'gone' —
 * the last one means FCM has retired that token and the caller drops it.
 */
async function sendTo(token, message) {
    if (!isConfigured()) return 'skipped';
    var c = config();
    try {
        await axios.post(
            'https://fcm.googleapis.com/v1/projects/' + c.projectId + '/messages:send',
            { message: Object.assign({ token: token }, message) },
            { headers: { Authorization: 'Bearer ' + (await accessToken()) }, timeout: 10000 });
        return 'sent';
    } catch (err) {
        var status = err.response && err.response.status;
        var detail = err.response && err.response.data && err.response.data.error;
        // 404 UNREGISTERED / 400 INVALID_ARGUMENT on the token: the device is gone.
        if (status === 404 || (detail && detail.status === 'UNREGISTERED') || (detail && detail.status === 'NOT_FOUND')) {
            return 'gone';
        }
        console.error('[partner_app] push failed', status || err.code || '', (detail && detail.message) || err.message);
        return 'failed';
    }
}

/**
 * Tells one account's devices about something. `payload.data` values must be
 * strings — FCM rejects anything else — and must never carry customer details.
 */
async function notify(refType, refId, payload) {
    var tokens = await devices.tokensFor(refType, refId);
    if (!tokens.length) return { sent: 0, devices: 0 };

    var message = {
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
        android: {
            priority: 'high',
            notification: {
                channel_id: payload.channelId || DEFAULT_CHANNEL,
                // Lets the app replace an earlier alert for the same order.
                tag: payload.tag || undefined,
                click_action: 'OPEN_ORDER'
            }
        }
    };

    var sent = 0;
    for (var i = 0; i < tokens.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        var result = await sendTo(tokens[i], message);
        if (result === 'sent') sent += 1;
        // eslint-disable-next-line no-await-in-loop
        if (result === 'gone') await devices.drop(tokens[i]);
    }
    return { sent: sent, devices: tokens.length };
}

module.exports = {
    isConfigured: isConfigured,
    notify: notify,
    DEFAULT_CHANNEL: DEFAULT_CHANNEL
};
