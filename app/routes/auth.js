const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../services/db');

const SALT_ROUNDS = 10;

// ─── REGISTER ────────────────────────────────────────────────────────────────

router.get('/register', function (req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('register', { formData: {}, clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '' });
});

router.post('/register', async function (req, res) {
    const { username, email, password, confirmPassword } = req.body;
    const formData = { username, email };
    const errors = [];

    if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(password || '')) errors.push('Password must contain at least one uppercase letter.');
    if (!/[0-9]/.test(password || '')) errors.push('Password must contain at least one number.');
    if (password !== confirmPassword) errors.push('Passwords do not match.');

    if (errors.length) {
        return res.status(400).render('register', { errors, formData, clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '' });
    }

    try {
        const existing = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email.toLowerCase(), username.trim()]
        );

        if (existing.length) {
            return res.status(400).render('register', {
                errors: ['An account with that email or username already exists.'],
                formData,
            });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username.trim(), email.toLowerCase(), hash]
        );

        req.session.user = { id: result.insertId, username: username.trim(), email: email.toLowerCase() };
        req.session.success = 'Welcome to ClosetSwap! Your account has been created.';
        res.redirect('/');
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).render('register', {
            errors: ['Something went wrong. Please try again.'],
            formData,
        });
    }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

router.get('/login', function (req, res) {
    if (req.session.user) return res.redirect('/');
    // Pass the Clerk publishable key so the pug template can init Clerk UI
    res.render('login', {
        formData: {},
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
    });
});

router.post('/login', async function (req, res) {
    const { email, password } = req.body;
    const formData = { email };

    if (!email || !password) {
        return res.status(400).render('login', {
            errors: ['Please enter both email and password.'],
            formData,
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
        });
    }

    try {
        const rows = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!rows.length) {
            return res.status(400).render('login', {
                errors: ['Invalid email or password.'],
                formData,
                clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
            });
        }

        const user = rows[0];
        // Clerk-managed users don't have a local password
        if (user.password_hash === 'CLERK_MANAGED') {
            return res.status(400).render('login', {
                errors: ['This account was created via Clerk. Please use the Clerk sign-in button.'],
                formData,
                clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
            });
        }

        const hash = user.password_hash || user.password;
        const matched = hash ? await bcrypt.compare(password, hash).catch(() => false) : false;

        if (!matched) {
            return res.status(400).render('login', {
                errors: ['Invalid email or password.'],
                formData,
                clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
            });
        }

        req.session.user = { id: user.id, username: user.username, email: user.email };
        req.session.success = `Welcome back, ${user.username}!`;
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).render('login', {
            errors: ['Something went wrong. Please try again.'],
            formData,
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
        });
    }
});

// ─── CLERK CALLBACK ───────────────────────────────────────────────────────────
// After Clerk signs the user in on the frontend, it posts a session token here.
// We verify it, upsert the user into MySQL, and create a local session.

router.post('/clerk-callback', async function (req, res) {
    const { clerkUserId, email, username } = req.body;

    if (!clerkUserId || !email) {
        return res.status(400).json({ error: 'Missing Clerk user data' });
    }

    try {
        const safeEmail = email.toLowerCase();
        const safeUsername = (username || safeEmail.split('@')[0]).trim();

        let rows = await db.query('SELECT * FROM users WHERE email = ?', [safeEmail]);

        if (!rows.length) {
            const result = await db.query(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [safeUsername, safeEmail, 'CLERK_MANAGED']
            );
            rows = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        }

        const dbUser = rows[0];
        req.session.user = { id: dbUser.id, username: dbUser.username, email: dbUser.email };
        req.session.success = `Welcome, ${dbUser.username}!`;

        res.json({ ok: true, redirect: '/' });
    } catch (err) {
        console.error('Clerk callback error:', err);
        res.status(500).json({ error: 'Server error during Clerk sync' });
    }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
    });
});

module.exports = router;
