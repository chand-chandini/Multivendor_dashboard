var sqldb = require('../../config/dbconnect');
var dbutil = require('../../utils/dbutils');
var platformCtrl = require('./platformCtrl');

// Simple in-memory limiter: max 5 enquiries per IP per 10 minutes
var WINDOW_MS = 10 * 60 * 1000;
var MAX_PER_WINDOW = 5;
var hits = {};

function clientIp(req) {
    return ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.ip || 'unknown';
}

// POST /super_admin/submitenquiry — called by the marketing website (no auth)
// Body: { enquiry_type: 'client'|'partner', contact_name, mobile_number, business_name?, email?, city?, business_type?, interested_plan_id?, message?, source? }
exports.submitenquiry = function (req, res) {
    var ip = clientIp(req);
    var now = Date.now();
    hits[ip] = (hits[ip] || []).filter(function (t) { return now - t < WINDOW_MS; });
    if (hits[ip].length >= MAX_PER_WINDOW) {
        return res.status(429).json({ status: 429, message: 'Too many requests. Please try again later.' });
    }
    hits[ip].push(now);

    var v;
    try {
        v = platformCtrl.validateEnquiry(req.body || {});
    } catch (e) {
        return res.json({ status: 202, message: e.userMessage || 'Invalid enquiry' });
    }

    // Same person re-submitting the same form within a day is not a new lead
    var dupQry = "SELECT id FROM website_enquiries WHERE mobile_number = ? AND enquiry_type = ? AND d_in = 0 AND i_ts >= NOW() - INTERVAL 1 DAY LIMIT 1";
    dbutil.sqlinjection(sqldb.MySQLConPool, dupQry, [v.mobile_number, v.enquiry_type], 'submitenquiry-dup', function (err, rows) {
        if (err) return res.json({ status: 500, message: 'Internal server error' });
        if (rows.length) return res.json({ status: 200, message: 'Thank you! Our team will contact you shortly.' });

        var planId = parseInt(req.body.interested_plan_id, 10);
        var QRY = "INSERT INTO website_enquiries (enquiry_type, contact_name, business_name, mobile_number, email, city, business_type, interested_plan_id, message, source, status, ip_address, i_ts) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())";
        var params = [v.enquiry_type, v.contact_name, v.business_name, v.mobile_number, v.email, v.city, v.business_type,
            isNaN(planId) ? null : planId, v.message, String(req.body.source || 'website').slice(0, 100), ip];
        dbutil.sqlinjection(sqldb.MySQLConPool, QRY, params, 'submitenquiry', function (err2) {
            if (err2) return res.json({ status: 500, message: 'Internal server error' });
            return res.json({ status: 200, message: 'Thank you! Our team will contact you shortly.' });
        });
    });
};
