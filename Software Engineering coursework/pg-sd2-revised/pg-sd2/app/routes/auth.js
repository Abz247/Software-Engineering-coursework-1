const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../services/db");

const SALT_ROUNDS = 10;

router.get("/register", function (req, res) {
    if (req.session.user) return res.redirect("/");
    res.render("auth/register", { title: "Register" });
});

router.post("/register", async function (req, res) {
    const { username, email, password, confirmPassword } = req.body;
    const errors = [];

    if (!username || username.trim().length < 3)
        errors.push("Username must be at least 3 characters.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push("Please enter a valid email address.");
    if (!password || password.length < 8)
        errors.push("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(password))
        errors.push("Password must contain at least one uppercase letter.");
    if (!/[0-9]/.test(password))
        errors.push("Password must contain at least one number.");
    if (password !== confirmPassword)
        errors.push("Passwords do not match.");

    if (errors.length > 0) {
        return res.render("auth/register", {
            title: "Register", errors: errors,
            username: username, email: email
        });
    }

    try {
        const existing = await db.query(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            [email.toLowerCase(), username.trim()]
        );

        if (existing.length > 0) {
            return res.render("auth/register", {
                title: "Register",
                errors: ["An account with that email or username already exists."],
                username: username, email: email
            });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await db.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username.trim(), email.toLowerCase(), hash]
        );

        req.session.user = {
            id: result.insertId,
            username: username.trim(),
            email: email.toLowerCase()
        };

        req.session.success = "Welcome to ClosetSwap! Your account has been created.";
        res.redirect("/");

    } catch (err) {
        console.error("Registration error:", err);
        res.render("auth/register", {
            title: "Register",
            errors: ["Something went wrong. Please try again."],
            username: username, email: email
        });
    }
});

router.get("/login", function (req, res) {
    if (req.session.user) return res.redirect("/");
    res.render("auth/login", { title: "Log In" });
});

router.post("/login", async function (req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render("auth/login", {
            title: "Log In",
            errors: ["Please enter both email and password."],
            email: email
        });
    }

    try {
        const results = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email.toLowerCase()]
        );

        if (results.length === 0) {
            return res.render("auth/login", {
                title: "Log In",
                errors: ["Invalid email or password."],
                email: email
            });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.render("auth/login", {
                title: "Log In",
                errors: ["Invalid email or password."],
                email: email
            });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        req.session.success = "Welcome back, " + user.username + "!";
        res.redirect("/");

    } catch (err) {
        console.error("Login error:", err);
        res.render("auth/login", {
            title: "Log In",
            errors: ["Something went wrong. Please try again."],
            email: email
        });
    }
});

router.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
        if (err) console.error("Logout error:", err);
        res.redirect("/login");
    });
});

module.exports = router;
