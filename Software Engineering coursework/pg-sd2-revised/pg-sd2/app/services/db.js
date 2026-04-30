require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_CONTAINER || process.env.MYSQL_HOST || 'db',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.MYSQL_ROOT_USER || process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASS || 'password',
    database: process.env.MYSQL_DATABASE || 'sd2-db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = { query };
