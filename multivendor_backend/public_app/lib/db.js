const pool = require('../../config/dbconnect').MySQLConPool;
const queryOn = (connection, sql, params = []) => new Promise((resolve, reject) => {
    connection.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});
exports.query = (sql, params) => queryOn(pool, sql, params);
exports.one = async (sql, params) => (await exports.query(sql, params))[0] || null;
exports.transaction = async function (work) {
    const connection = await new Promise((resolve, reject) => pool.getConnection((error, c) => error ? reject(error) : resolve(c)));
    const q = (sql, params) => queryOn(connection, sql, params);
    try {
        await q('START TRANSACTION');
        const result = await work(q);
        await q('COMMIT');
        return result;
    } catch (error) { await q('ROLLBACK'); throw error; }
    finally { connection.release(); }
};
