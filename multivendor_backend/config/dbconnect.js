var mysql = require('mysql');
var fs = require('fs');
var path = require('path');

// Load .env
try {
    fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).forEach(function (line) {
        var m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    });
} catch (e) { /* no .env */ }

function env(name, fallback) {
    return process.env[name] !== undefined ? process.env[name] : fallback;
}
var USER = env('MV_DB_USER', 'root');
var PWD = env('MV_DB_PASSWORD', '');
var DATABASE = env('MV_DB_NAME', 'ekart360_db');
var DB_HOST_NAME = env('MV_DB_HOST', 'localhost');
var DB_PORT = parseInt(process.env.MV_DB_PORT, 10) || 3306;

var MAX_POOL_SIZE = 100;

var MySQLConPool = mysql.createPool({
    host: DB_HOST_NAME,
    port: DB_PORT,
    user: USER,
    password: PWD,
    database: DATABASE,
    connectTimeout: 20000,
    connectionLimit: MAX_POOL_SIZE,
    debug: false,
    multipleStatements: true,
    charset: 'utf8mb4'
});

exports.MySQLConPool = MySQLConPool;
