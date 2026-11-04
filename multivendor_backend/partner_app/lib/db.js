// Partner App - database helpers
// Thin promise wrappers over utils/dbutils.sqlinjection so multi-step flows
// (accept order -> history -> offers) read top to bottom. Always parameterised.

var sqldb = require('../../config/dbconnect');
var dbutil = require('../../utils/dbutils');

function query(sql, params, ctx) {
    return new Promise(function (resolve, reject) {
        dbutil.sqlinjection(sqldb.MySQLConPool, sql, params || [], 'partner_app:' + (ctx || 'query'), function (err, rows) {
            if (err) return reject(new Error('Query failed: ' + (ctx || sql.slice(0, 60))));
            resolve(rows);
        });
    });
}

async function one(sql, params, ctx) {
    var rows = await query(sql, params, ctx);
    return rows && rows.length ? rows[0] : null;
}

/** Wraps an async handler so any thrown error becomes the usual 500 envelope. */
function handle(fn) {
    return function (req, res) {
        Promise.resolve(fn(req, res)).catch(function (err) {
            console.error('[partner_app]', req.originalUrl, err && err.message);
            if (!res.headersSent) res.json({ status: 500, message: 'Internal server error' });
        });
    };
}

/** 202 is the project's "understood but refused" status. */
function refuse(res, message) {
    return res.json({ status: 202, message: message });
}

module.exports = { query: query, one: one, handle: handle, refuse: refuse };
