const express = require("express");
const router = express.Router();
const db = require("../services/db");

// Add rating
router.post("/", async (req, res) => {
    const { user_id, rating } = req.body;
    const reviewer_id = req.session.userId;

    if (!reviewer_id) {
        return res.status(401).send("Not logged in");
    }

    if (user_id == reviewer_id) {
        return res.status(400).send("Cannot rate yourself");
    }

    try {
        const existing = await db.query(
            "SELECT * FROM ratings WHERE user_id = ? AND reviewer_id = ?",
            [user_id, reviewer_id]
        );

        if (existing.length > 0) {
            return res.status(400).send("Already rated");
        }

        await db.query(
            "INSERT INTO ratings (user_id, reviewer_id, rating) VALUES (?, ?, ?)",
            [user_id, reviewer_id, rating]
        );

        res.send("Rating added");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

// Get ratings
router.get("/:userId", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT AVG(rating) AS avg_rating, COUNT(*) AS total 
             FROM ratings WHERE user_id = ?`,
            [req.params.userId]
        );

        res.json(result[0]);

    } catch (err) {
        res.status(500).send("Error");
    }
});

module.exports = router;