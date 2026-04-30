const express = require("express");
const router = express.Router();
const db = require("../services/db");
const { requireLogin } = require("../middleware/auth");

router.use(requireLogin);

// GET /messages/inbox – render inbox page
router.get("/inbox", async function (req, res) {
    const userId = req.session.user.id;
    try {
        const conversations = await db.query(
            `SELECT
                other_user.id AS user_id,
                other_user.username,
                m.content AS last_message,
                m.created_at AS last_message_time,
                m.sender_id AS last_sender_id,
                (SELECT COUNT(*) FROM messages
                 WHERE receiver_id = ? AND sender_id = other_user.id AND is_read = FALSE
                ) AS unread_count
             FROM messages m
             JOIN users other_user ON other_user.id = (
                 CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
             )
             WHERE (m.sender_id = ? OR m.receiver_id = ?)
               AND m.id IN (
                   SELECT MAX(id) FROM messages
                   WHERE sender_id = ? OR receiver_id = ?
                   GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
               )
             ORDER BY m.created_at DESC`,
            [userId, userId, userId, userId, userId, userId]
        );
        res.render("inbox", { conversations });
    } catch (err) {
        console.error("Inbox error:", err);
        res.status(500).send("Could not load inbox");
    }
});

// GET /messages/unread/count – JSON badge count (must be before /:userId)
router.get("/unread/count", async function (req, res) {
    const userId = req.session.user.id;
    try {
        const result = await db.query(
            "SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = FALSE",
            [userId]
        );
        res.json({ success: true, unread_count: result[0].count });
    } catch (err) {
        console.error("Unread count error:", err);
        res.status(500).json({ success: false, error: "Could not get unread count" });
    }
});

// GET /messages/:userId – render conversation page
router.get("/:userId", async function (req, res) {
    const currentUserId = req.session.user.id;
    const otherUserId = parseInt(req.params.userId);

    if (isNaN(otherUserId)) {
        return res.status(400).send("Invalid user ID");
    }

    try {
        const userCheck = await db.query(
            "SELECT id, username FROM users WHERE id = ?",
            [otherUserId]
        );
        if (userCheck.length === 0) {
            return res.status(404).send("User not found");
        }

        const messages = await db.query(
            `SELECT id, sender_id, receiver_id, content, is_read, created_at
             FROM messages
             WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)
             ORDER BY created_at ASC`,
            [currentUserId, otherUserId, otherUserId, currentUserId]
        );

        await db.query(
            `UPDATE messages SET is_read = TRUE
             WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [otherUserId, currentUserId]
        );

        res.render("conversation", {
            other_user: userCheck[0],
            messages,
            currentUserId
        });
    } catch (err) {
        console.error("Get conversation error:", err);
        res.status(500).send("Could not load conversation");
    }
});

// POST /messages/send – send a message then redirect to conversation
router.post("/send", async function (req, res) {
    const senderId = req.session.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content || content.trim().length === 0) {
        return res.redirect("back");
    }
    if (content.length > 1000) {
        return res.redirect("back");
    }
    if (parseInt(receiver_id) === senderId) {
        return res.redirect("back");
    }

    try {
        const receiverCheck = await db.query(
            "SELECT id FROM users WHERE id = ?",
            [receiver_id]
        );
        if (receiverCheck.length === 0) {
            return res.redirect("/messages/inbox");
        }

        await db.query(
            "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
            [senderId, receiver_id, content.trim()]
        );

        res.redirect(`/messages/${receiver_id}`);
    } catch (err) {
        console.error("Send message error:", err);
        res.redirect("back");
    }
});

module.exports = router;