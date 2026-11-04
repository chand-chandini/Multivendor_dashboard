const request = require('request');

const providerConfig = () => ({
    enabled: process.env.MV_SMS_ENABLED === '1',
    url: process.env.MV_SMS_API_URL || 'https://sms.sunstechit.com/app/smsapi/index.php',
    key: process.env.MV_SMS_API_KEY || '',
    campaign: process.env.MV_SMS_CAMPAIGN || '0',
    routeId: process.env.MV_SMS_ROUTE_ID || '13',
    senderId: process.env.MV_SMS_SENDER_ID || 'GDWOTP',
    templateId: process.env.MV_SMS_TEMPLATE_ID || '1207173899985649979',
});

const messageFor = otp => `Your OTP for verification is ${otp}. Do not share this with anyone. - Godavari Wave Technologies`;

/** Sends the login OTP using the approved Sunstech SMS template. */
exports.sendLoginOtp = ({ mobile, otp }) => {
    const config = providerConfig();
    if (!config.enabled) return Promise.resolve({ sent: false, skipped: true });
    if (!config.key) {
        const error = new Error('SMS provider is enabled but MV_SMS_API_KEY is missing.');
        error.code = 'SMS_PROVIDER_NOT_CONFIGURED';
        return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
        request.get({
            url: config.url,
            qs: {
                key: config.key,
                campaign: config.campaign,
                routeid: config.routeId,
                type: 'text',
                contacts: mobile,
                senderid: config.senderId,
                msg: messageFor(otp),
                template_id: config.templateId,
            },
            timeout: Number(process.env.MV_SMS_TIMEOUT_MS || 10000),
        }, (error, response, body) => {
            if (error) return reject(error);
            if (!response || response.statusCode < 200 || response.statusCode >= 300) {
                const providerError = new Error(`SMS provider returned HTTP ${response ? response.statusCode : 'no response'}.`);
                providerError.code = 'SMS_PROVIDER_HTTP_ERROR';
                return reject(providerError);
            }
            const providerBody = String(body || '').trim();
            if (/\b(error|failed|failure|invalid|insufficient|not enough|unable)\b/i.test(providerBody)) {
                const providerError = new Error('SMS provider rejected the message.');
                providerError.code = 'SMS_PROVIDER_REJECTED';
                return reject(providerError);
            }
            return resolve({ sent: true });
        });
    });
};

exports.messageFor = messageFor;
