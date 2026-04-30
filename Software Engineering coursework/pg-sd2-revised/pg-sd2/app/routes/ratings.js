const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { requireLogin } = require('../middleware/auth');

router.post('/', requireLogin, async function(req, res) {
    const userId = Number(req.body.user_id);
    const reviewerId = Number(req.session.user.id);
    const rating = Number(req.body.rating);
    const redirectTo = req.body.redirect_to || `/users/${userId}`;

    if (!userId || !rating || rating < 1 || rating > 5) {
        req.session.error = 'Please choose a rating from 1 to 5.';
        return res.redirect(redirectTo);
    }

    if (userId === reviewerId) {
        req.session.error = 'You cannot rate yourself.';
        return res.redirect(redirectTo);
    }

    try {
        await db.query(
            `INSERT INTO ratings (user_id, reviewer_id, rating)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
            [userId, reviewerId, rating]
        );

        req.session.success = 'Rating submitted.';
        res.redirect(redirectTo);
    } catch (err) {
        console.error('Rating error:', err);
        req.session.error = 'Could not submit rating.';
        res.redirect(redirectTo);
    }
});

module.exports = router;
