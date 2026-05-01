require('dotenv').config();
const mysql = require('mysql2/promise');

function createPool(host, port) {
    return mysql.createPool({
        host,
        port,
        user: process.env.MYSQL_ROOT_USER || process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASS || 'password',
        database: process.env.MYSQL_DATABASE || 'sd2-db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
}

const primaryPool = createPool(
    process.env.DB_CONTAINER || process.env.MYSQL_HOST || 'db',
    Number(process.env.DB_PORT || 3306)
);

const localDockerPool = createPool('localhost', 3309);

async function runQuery(pool, sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

function shouldTryLocalDockerDb(err) {
    return ['ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN'].includes(err.code);
}

async function query(sql, params) {
    try {
        return await runQuery(primaryPool, sql, params);
    } catch (err) {
        if (!shouldTryLocalDockerDb(err)) {
            throw err;
        }

        return await runQuery(localDockerPool, sql, params);
    }
}

module.exports = { query };
