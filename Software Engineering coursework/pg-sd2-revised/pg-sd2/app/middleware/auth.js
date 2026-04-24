function attachUser(req, res, next) {
    res.locals.user = req.session.user || null;
    res.locals.success = req.session.success || null;
    res.locals.error = req.session.error || null;
    delete req.session.success;
    delete req.session.error;
    next();
}

function requireLogin(req, res, next) {
    if (!req.session.user) {
        req.session.error = "Please log in to access that page.";
        return res.redirect("/login");
    }
    next();
}

module.exports = { attachUser, requireLogin };
