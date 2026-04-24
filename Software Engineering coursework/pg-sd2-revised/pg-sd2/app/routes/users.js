const express = require("express");
const router = express.Router();
const db = require("../services/db");

router.get("/", async function (req, res) {
    try {
        const users = await db.query(
            "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC"
        );
        res.render("users/list", { title: "All Users", users: users });
    } catch (err) {
        console.error("Error fetching users:", err);
        req.session.error = "Could not load users.";
        res.redirect("/");
    }
});

router.get("/:id", async function (req, res) {
    var userId = req.params.id;

    if (isNaN(userId)) {
        req.session.error = "Invalid user ID.";
        return res.redirect("/users");
    }

    try {
        const userResults = await db.query(
            "SELECT id, username, email, created_at FROM users WHERE id = ?",
            [userId]
        );

        if (userResults.length === 0) {
            req.session.error = "User not found.";
            return res.redirect("/users");
        }

        var profileUser = userResults[0];

        var listings = await db.query(
            `SELECT l.id, l.title, l.price, l.size, l.condition,
                    l.image_url, l.status, l.created_at,
                    c.name AS category
             FROM listings l
             LEFT JOIN categories c ON l.category_id = c.id
             WHERE l.user_id = ?
             ORDER BY l.created_at DESC`,
            [userId]
        );

        res.render("users/profile", {
            title: profileUser.username + "'s Profile",
            profileUser: profileUser,
            listings: listings,
            listingCount: listings.length
        });

    } catch (err) {
        console.error("Error fetching user profile:", err);
        req.session.error = "Could not load profile.";
        res.redirect("/users");
    }
});

module.exports = router;
