const db = require('../services/db');

async function getAllListings() {
    const rows = await db.query(`
        SELECT listings.*, users.username, categories.name AS category
        FROM listings
        JOIN users ON listings.user_id = users.id
        JOIN categories ON listings.category_id = categories.id
        ORDER BY listings.created_at DESC
    `);
    return rows;
}

async function getListingById(id) {
    const rows = await db.query(`
        SELECT listings.*, users.username, categories.name AS category
        FROM listings
        JOIN users ON listings.user_id = users.id
        JOIN categories ON listings.category_id = categories.id
        WHERE listings.id = ?
    `, [id]);
    return rows[0];
}

async function getListingsByUserId(userId) {
    const rows = await db.query(`
        SELECT listings.*, users.username, categories.name AS category
        FROM listings
        JOIN users ON listings.user_id = users.id
        JOIN categories ON listings.category_id = categories.id
        WHERE listings.user_id = ?
        ORDER BY listings.created_at DESC
    `, [userId]);
    return rows;
}

async function getListingsByCategory(categoryId) {
    const rows = await db.query(`
        SELECT listings.*, users.username, categories.name AS category
        FROM listings
        JOIN users ON listings.user_id = users.id
        JOIN categories ON listings.category_id = categories.id
        WHERE listings.category_id = ?
        ORDER BY listings.created_at DESC
    `, [categoryId]);
    return rows;
}

async function getAllCategories() {
    const rows = await db.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
}

async function createListing({ user_id, category_id, title, description, price, size, condition, image_url }) {
    return await db.query(`
        INSERT INTO listings (user_id, category_id, title, description, price, size, \`condition\`, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, category_id, title, description, price, size || null, condition || null, image_url || null]);
}

async function updateListing(id, { category_id, title, description, price, size, condition, image_url, status }) {
    return await db.query(`
        UPDATE listings
        SET category_id = ?, title = ?, description = ?, price = ?, size = ?, \`condition\` = ?, image_url = ?, status = ?
        WHERE id = ?
    `, [category_id, title, description, price, size || null, condition || null, image_url || null, status || 'Available', id]);
}

async function deleteListing(id) {
    return await db.query('DELETE FROM listings WHERE id = ?', [id]);
}

module.exports = {
    getAllListings,
    getListingById,
    getListingsByUserId,
    getListingsByCategory,
    getAllCategories,
    createListing,
    updateListing,
    deleteListing
};