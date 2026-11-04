const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const database = process.env.MV_DB_NAME || 'multivendor_db';
const dump = process.env.MV_DB_DUMP || path.resolve(__dirname, '../../../multivendor_db.sql');
const connection = mysql.createConnection({
    host: process.env.MV_DB_HOST || '127.0.0.1',
    port: Number(process.env.MV_DB_PORT || 3306),
    user: process.env.MV_DB_USER || 'root',
    password: process.env.MV_DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
});

const sql = fs.readFileSync(dump, 'utf8');
connection.connect(error => {
    if (error) throw error;
    connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; USE \`${database}\`; ${sql}`, error => {
        if (error) { console.error('Local database bootstrap failed:', error.code || error.message); process.exitCode = 1; }
        else console.log(`Local database ready: ${database}`);
        connection.end();
    });
});
