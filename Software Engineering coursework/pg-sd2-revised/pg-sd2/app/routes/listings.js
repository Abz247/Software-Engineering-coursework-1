aconst express = require('express');
const router = express.Router();
const listingModel = require('../models/listingModel');
const { requireLogin } = require('../middleware/auth');

function validateListingForm(data) {
    const errors = [];

    const title = data.title ? data.title.trim() : '';
    const description = data.description ? data.description.trim() : '';
    const imageUrl = data.image_url ? data.image_url.trim() : '';
    const price = Number(data.price);
    const categoryId = Number(data.category_id);

    if (!title) {
        errors.push('Title is required.');
    } else if (title.length < 3) {
        errors.push('Title must be at least 3 characters.');
    } else if (title.length > 100) {
        errors.push('Title must be 100 characters or fewer.');
    }

    if (!description) {
        errors.push('Description is required.');
    } else if (description.length < 10) {
        errors.push('Description must be at least 10 characters.');
    }

    if (data.price === undefined || data.price === null || data.price === '') {
        errors.push('Price is required.');
    } else if (Number.isNaN(price) || price < 0) {
        errors.push('Price must be a valid non-negative number.');
    }

    if (!data.category_id) {
        errors.push('Category is required.');
    } else if (Number.isNaN(categoryId) || categoryId <= 0) {
        errors.push('Category must be valid.');
    }

    if (imageUrl && !/^https?:\/\/.+/i.test(imageUrl)) {
        errors.push('Image URL must start with http:// or https://');
    }

    return errors;
}

router.get('/', async (req, res) => {
    try {
        const listings = await listingModel.getAllListings();
        const categories = await listingModel.getAllCategories();
        const term = (req.query.search || '').trim().toLowerCase();

        const filtered = term
            ? listings.filter(item =>
                (item.title || '').toLowerCase().includes(term) ||
                (item.description || '').toLowerCase().includes(term) ||
                (item.category || '').toLowerCase().includes(term)
            )
            : listings;

        res.render('listings', {
            listings: filtered,
            categories,
            selectedCategory: null,
            searchTerm: req.query.search || ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading listings');
    }
});

router.get('/create', requireLogin, async (req, res) => {
    try {
        const categories = await listingModel.getAllCategories();
        res.render('create-listing', {
            categories,
            errors: [],
            formData: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading create page');
    }
});

router.post('/create', requireLogin, async (req, res) => {
    try {
        const categories = await listingModel.getAllCategories();
        const errors = validateListingForm(req.body);

        if (errors.length > 0) {
            return res.status(400).render('create-listing', {
                categories,
                errors,
                formData: req.body
            });
        }

        const { title, description, price, category_id, size, condition, image_url } = req.body;

        await listingModel.createListing({
            user_id: req.session.user.id,
            category_id,
            title: title.trim(),
            description: description.trim(),
            price,
            size,
            condition,
            image_url: image_url ? image_url.trim() : ''
        });

        req.session.success = 'Listing created successfully.';
        res.redirect('/listings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating listing');
    }
});

router.get('/edit/:id', requireLogin, async (req, res) => {
    try {
        const listing = await listingModel.getListingById(req.params.id);
        const categories = await listingModel.getAllCategories();

        if (!listing) {
            return res.status(404).send('Listing not found');
        }

        if (listing.user_id !== req.session.user.id) {
            req.session.error = 'You can only edit your own listings.';
            return res.redirect(`/listings/${req.params.id}`);
        }

        res.render('edit-listing', {
            listing,
            categories,
            errors: [],
            formData: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading edit page');
    }
});

router.post('/edit/:id', requireLogin, async (req, res) => {
    try {
        const listing = await listingModel.getListingById(req.params.id);
        const categories = await listingModel.getAllCategories();

        if (!listing) {
            return res.status(404).send('Listing not found');
        }

        if (listing.user_id !== req.session.user.id) {
            req.session.error = 'You can only edit your own listings.';
            return res.redirect(`/listings/${req.params.id}`);
        }

        const errors = validateListingForm(req.body);

        if (errors.length > 0) {
            return res.status(400).render('edit-listing', {
                listing,
                categories,
                errors,
                formData: req.body
            });
        }

        const { title, description, price, category_id, size, condition, image_url, status } = req.body;

        await listingModel.updateListing(req.params.id, {
            category_id,
            title: title.trim(),
            description: description.trim(),
            price,
            size,
            condition,
            image_url: image_url ? image_url.trim() : '',
            status: status || listing.status
        });

        req.session.success = 'Listing updated successfully.';
        res.redirect('/listings/' + req.params.id);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating listing');
    }
});

router.post('/delete/:id', requireLogin, async (req, res) => {
    try {
        const listing = await listingModel.getListingById(req.params.id);

        if (!listing) {
            return res.status(404).send('Listing not found');
        }

        if (listing.user_id !== req.session.user.id) {
            req.session.error = 'You can only delete your own listings.';
            return res.redirect(`/listings/${req.params.id}`);
        }

        await listingModel.deleteListing(req.params.id);
        req.session.success = 'Listing deleted successfully.';
        res.redirect('/listings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting listing');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const listing = await listingModel.getListingById(req.params.id);

        if (!listing) {
            return res.status(404).render('listing', { listing: null });
        }

        res.render('listing', { listing });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading listing');
    }
});

module.exports = router;