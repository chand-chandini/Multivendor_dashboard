var express = require('express');
var app = express();
app.set('etag', false);
const http = require("http");
const https = require("https");
var mysql = require('mysql');
var bodyParser = require('body-parser');
var useragent = require('express-useragent');
const fs = require("fs");
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
appRoot = __dirname;


app.use(useragent.express());
app.use(bodyParser.json({
    limit: '50mb',
    verify: function (req, res, buf) { req.rawBody = buf; }
}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(require('morgan')('dev'));
app.use(function (req, res, next) {
    if (req.body && Object.keys(req.body).length) {
        console.log('%s %s payload: %s', req.method, req.originalUrl, JSON.stringify(req.body, function (key, value) {
            return /aadhar|aadhaar|pan_number|pannumber|driving_license|drivinglicense|bank|account|ifsc|pwd|password/i.test(key) ? '[redacted]' : value;
        }));
    }
    next();
});

var corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

app.use(logErrors);

// Locally uploaded images
var uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, { maxAge: '1h' }));

// API routes
app.use('/dashboard_api', require('./dashboard_api/routes/routes'));
app.use('/public_app', require('./public_app/routes/routes'));
app.use('/super_admin', require('./super_admin/routes/routes'));
app.use('/partner_app', require('./partner_app/routes/routes'));

// Customer API error envelope. The public router also installs this locally,
// while this final handler catches errors raised by future mounted routes.
app.use(function (err, req, res, next) {
    if (res.headersSent) return next(err);
    console.error('[api]', req.method, req.originalUrl, err && err.message);
    res.status(err.status || 500).json({
        error: { code: err.code || 'SERVER_ERROR', message: err.status ? err.message : 'The service could not complete your request.' }
    });
});

function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}

app.get('/', function (req, res) {
    res.send("Multivendor Server");
});

module.exports = app;

if (require.main === module) {
 const sslOptions = {
        key: fs.readFileSync('./privatekey.pem'),
        cert: fs.readFileSync('./cert.crt'),
        passphrase: '123456'
    };

 const port = Number(process.env.PORT || 2022);
    const useHttps = process.env.MV_USE_HTTPS !== '0';
    const server = useHttps ? https.createServer(sslOptions, app) : http.createServer(app);
require('./socket').init(server);

server.listen(port, function () {
    const host = server.address().address;
    const currentPort = server.address().port;
    console.log('ProductBase is listening at %s://%s:%s', useHttps ? 'https' : 'http', host, currentPort);
});
}
