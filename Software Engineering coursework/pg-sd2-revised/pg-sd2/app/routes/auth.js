const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../services/db');

const SALT_ROUNDS = 10;

function normaliseUsername(value, fallback) {
    return String(value || fallback || 'student')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'student';
}

async function getAvailableUsername(baseUsername) {
    const base = normaliseUsername(baseUsername);
    let username = base;
    let suffix = 1;

    while (suffix < 1000) {
        const existing = await db.query('SELECT id FROM users WHERE username = ?', [username]);

        if (!existing.length) {
            return username;
        }

        suffix += 1;
        username = `${base}_${suffix}`;
    }

    return `${base}_${Date.now()}`;
}

router.get('/register', function (req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('register', {
        title: 'Register',
        formData: {},
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
    });
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
        return res.status(400).render('register', {
            title: 'Register',
            errors,
            formData,
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
        });
    }

    try {
        const existing = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email.toLowerCase(), username.trim()]
        );

        if (existing.length) {
            return res.status(400).render('register', {
                title: 'Register',
                errors: ['An account with that email or username already exists.'],
                formData,
                clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
            });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username.trim(), email.toLowerCase(), hash]
        );

        req.session.user = {
            id: result.insertId,
            username: username.trim(),
            email: email.toLowerCase()
        };

        req.session.success = 'Welcome to ClosetSwap! Your account has been created.';
        req.session.save(function (err) {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect('/login');
            }

            res.redirect('/');
        });
    } catch (err) {
        console.error('Registration error:', err);
        const duplicateAccount = err && err.code === 'ER_DUP_ENTRY';

        res.status(duplicateAccount ? 400 : 500).render('register', {
            title: 'Register',
            errors: [duplicateAccount ? 'An account with that email or username already exists.' : 'Something went wrong. Please try again.'],
            formData,
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
        });
    }
});

router.get('/login', function (req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('login', {
        title: 'Log In',
        formData: {},
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
    });
});

router.post('/login', async function (req, res) {
    const { email, password } = req.body;
    const formData = { email };

    if (!email || !password) {
        return res.status(400).render('login', {
            title: 'Log In',
            errors: ['Please enter both email and password.'],
            formData,
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
        });
    }

    try {
        const rows = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (!rows.length) {
            return res.status(400).render('login', {
                title: 'Log In',
                errors: ['Invalid email or password.'],
                formData,
                clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
            });
        }

        const user = rows[0];
        const hash = user.password_hash || user.password;
        const matched = hash ? await bcrypt.compare(password, hash).catch(() => false) : false;

        if (!matched) {
            return res.status(400).render('login', {
                title: 'Log In',
                errors: ['Invalid email or password.'],
                formData,
                clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
            });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        req.session.success = `Welcome back, ${user.username}!`;
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).render('login', {
            title: 'Log In',
            errors: ['Something went wrong. Please try again.'],
            formData,
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
        });
    }
});

router.post('/auth/clerk/session', async function (req, res) {
    const { clerkUserId, email, username, fullName } = req.body;
    const userEmail = String(email || '').trim().toLowerCase();

    if (!clerkUserId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        return res.status(400).json({ error: 'A valid Clerk user and email address are required.' });
    }

    try {
        let rows = await db.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        let user = rows[0];

        if (!user) {
            const baseUsername = username || fullName || userEmail.split('@')[0];
            const availableUsername = await getAvailableUsername(baseUsername);
            const result = await db.query(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [availableUsername, userEmail, `clerk:${clerkUserId}`]
            );

            rows = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = rows[0];
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        res.json({ success: true, redirectTo: '/' });
    } catch (err) {
        console.error('Clerk session error:', err);
        res.status(500).json({ error: 'Unable to create a session. Please try again.' });
    }
});

router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
    });
});

module.exports = router;
