/**
 * Messages Routes – Sprint 4 Messaging System
 *
 * All routes require authentication (protected by requireLogin middleware).
 * Users can only send/view messages involving themselves.
 */

const express = require("express");
const router = express.Router();
const db = require("../services/db");
const { requireLogin } = require("../middleware/auth");

// All message routes require login
router.use(requireLogin);

// =============================================================
//  POST /messages/send – send a new message
//  Body: { receiver_id, content }
// =============================================================
router.post("/send", async function (req, res) {
    const senderId = req.session.user.id;
    const { receiver_id, content } = req.body;

    // ---- Validation ----
    if (!receiver_id || !content) {
        return res.status(400).json({
            success: false,
            error: "receiver_id and content are required"
        });
    }

    if (content.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: "Message cannot be empty"
        });
    }

    if (content.length > 1000) {
        return res.status(400).json({
            success: false,
            error: "Message too long (max 1000 characters)"
        });
    }

    if (parseInt(receiver_id) === senderId) {
        return res.status(400).json({
            success: false,
            error: "You cannot message yourself"
        });
    }

    try {
        // ---- Verify receiver exists ----
        const receiverCheck = await db.query(
            "SELECT id, username FROM users WHERE id = ?",
            [receiver_id]
        );

        if (receiverCheck.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Receiver not found"
            });
        }

        // ---- Insert the message ----
        const result = await db.query(
            "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
            [senderId, receiver_id, content.trim()]
        );

        res.json({
            success: true,
            message: {
                id: result.insertId,
                sender_id: senderId,
                receiver_id: parseInt(receiver_id),
                content: content.trim(),
                created_at: new Date().toISOString()
            }
        });

    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({
            success: false,
            error: "Could not send message"
        });
    }
});

// =============================================================
//  GET /messages/inbox – list all conversations for logged-in user
//  Returns the latest message from each person they've talked to
// =============================================================
router.get("/inbox", async function (req, res) {
    const userId = req.session.user.id;

    try {
        // Get the latest message from each conversation partner
        const conversations = await db.query(
            `SELECT
                other_user.id AS user_id,
                other_user.username,
                other_user.email,
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

        res.json({
            success: true,
            conversations: conversations
        });

    } catch (err) {
        console.error("Inbox error:", err);
        res.status(500).json({
            success: false,
            error: "Could not load inbox"
        });
    }
});

// =============================================================
//  GET /messages/:userId – get full conversation with another user
// =============================================================
router.get("/:userId", async function (req, res) {
    const currentUserId = req.session.user.id;
    const otherUserId = parseInt(req.params.userId);

    if (isNaN(otherUserId)) {
        return res.status(400).json({
            success: false,
            error: "Invalid user ID"
        });
    }

    try {
        // ---- Check the other user exists ----
        const userCheck = await db.query(
            "SELECT id, username FROM users WHERE id = ?",
            [otherUserId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // ---- Fetch all messages between the two users ordered by time ----
        const messages = await db.query(
            `SELECT id, sender_id, receiver_id, content, is_read, created_at
             FROM messages
             WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)
             ORDER BY created_at ASC`,
            [currentUserId, otherUserId, otherUserId, currentUserId]
        );

        // ---- Mark messages from the other user as read ----
        await db.query(
            `UPDATE messages
             SET is_read = TRUE
             WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [otherUserId, currentUserId]
        );

        res.json({
            success: true,
            other_user: userCheck[0],
            messages: messages
        });

    } catch (err) {
        console.error("Get conversation error:", err);
        res.status(500).json({
            success: false,
            error: "Could not load conversation"
        });
    }
});

// =============================================================
//  GET /messages/unread/count – get unread message count (for badge)
// =============================================================
router.get("/unread/count", async function (req, res) {
    const userId = req.session.user.id;

    try {
        const result = await db.query(
            "SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = FALSE",
            [userId]
        );

        res.json({
            success: true,
            unread_count: result[0].count
        });

    } catch (err) {
        console.error("Unread count error:", err);
        res.status(500).json({
            success: false,
            error: "Could not get unread count"
        });
    }
});

module.exports = router;
