const db = require('../services/db');

async function getAllUsers() {
    const rows = await db.query('SELECT * FROM users');
    return rows;
}

async function getUserById(id) {
    const rows = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
}

async function createUser(username, email, passwordHash) {
    return await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
    );
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser
};