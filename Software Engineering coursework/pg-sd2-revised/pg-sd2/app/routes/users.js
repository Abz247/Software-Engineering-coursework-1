const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const listingModel = require('../models/listingModel');

router.get('/', async function(req, res) {
    try {
        const users = await userModel.getAllUsers();

        res.render('users/list', {
            title: 'All Users',
            users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        req.session.error = 'Could not load users.';
        res.redirect('/');
    }
});

router.get('/:id', async function(req, res) {
    const userId = req.params.id;

    if (isNaN(userId)) {
        req.session.error = 'Invalid user ID.';
        return res.redirect('/users');
    }

    try {
        const profileUser = await userModel.getUserById(userId);

        if (!profileUser) {
            req.session.error = 'User not found.';
            return res.redirect('/users');
        }

        const listings = await listingModel.getListingsByUserId(userId);

        res.render('users/profile', {
            title: `${profileUser.username}'s Profile`,
            profileUser,
            listings,
            listingCount: listings.length
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        req.session.error = 'Could not load profile.';
        res.redirect('/users');
    }
});

module.exports = router;
