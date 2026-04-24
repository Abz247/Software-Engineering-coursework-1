const db = require('../services/db');

async function attachUser(req, res, next) {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
    }
    res.locals.success = req.session?.success;
    res.locals.error = req.session?.error;
    if (req.session) {
        delete req.session.success;
        delete req.session.error;
    }
    next();
}

function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    req.session.error = 'Please sign in to continue.';
    res.redirect('/login');
}

module.exports = { attachUser, requireLogin };
