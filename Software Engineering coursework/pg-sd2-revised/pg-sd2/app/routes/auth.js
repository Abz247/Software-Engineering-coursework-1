const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../services/db');

const SALT_ROUNDS = 10;

router.get('/register', function (req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('register', { formData: {} });
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
        return res.status(400).render('register', { errors, formData });
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

router.get('/login', function (req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('login', { formData: {} });
});

router.post('/login', async function (req, res) {
    const { email, password } = req.body;
    const formData = { email };

    if (!email || !password) {
        return res.status(400).render('login', {
            errors: ['Please enter both email and password.'],
            formData,
        });
    }

    try {
        const rows = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!rows.length) {
            return res.status(400).render('login', {
                errors: ['Invalid email or password.'],
                formData,
            });
        }

        const user = rows[0];
        const hash = user.password_hash || user.password;
        const matched = hash ? await bcrypt.compare(password, hash).catch(() => false) : false;

        if (!matched) {
            return res.status(400).render('login', {
                errors: ['Invalid email or password.'],
                formData,
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
        });
    }
});

router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
    });
});

module.exports = router;
