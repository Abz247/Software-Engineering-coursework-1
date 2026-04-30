const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const listingModel = require('../models/listingModel');

// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.render('users', { users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading users");
    }
});

// GET single user profile
router.get('/:id', async (req, res) => {
    try {
        const profileUser = await userModel.getUserById(req.params.id);

        if (!profileUser) {
            return res.status(404).render('profile', {
                profileUser: null
            });
        }

        const userListings = await listingModel.getListingsByUserId(req.params.id);

        res.render('profile', {
            profileUser: { ...profileUser, listings: userListings }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading profile");
    }
});

module.exports = router;