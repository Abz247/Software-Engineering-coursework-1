const express = require('express');
const session = require('express-session');
const path = require('path');
const env = require('dotenv').config();

if (env.parsed) {
    Object.assign(process.env, env.parsed);
}

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('static'));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'closetswap-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        httpOnly: true,
        secure: false
    }
}));

const { attachUser } = require('./middleware/auth');
app.use(attachUser);
app.use(function(req, res, next) {
    res.locals.clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || '';
    next();
});


const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const listingsRoutes = require('./routes/listings');
const messageRoutes = require('./routes/messages');
const ratingsRoutes = require('./routes/ratings');
const listingModel = require('./models/listingModel');

app.get('/', async function(req, res) {
    try {
        const listings = await listingModel.getAllListings();
        res.render('index', {
            title: 'Home',
            heading: 'Welcome to ClosetSwap',
            listings: listings.slice(0, 8)
        });
    } catch (err) {
        console.error('Homepage error:', err);
        res.render('index', {
            title: 'Home',
            heading: 'Welcome to ClosetSwap',
            listings: []
        });
    }
});

app.use('/', authRoutes);
app.use('/users', usersRoutes);
app.use('/listings', listingsRoutes);
app.use('/messages', messageRoutes);
app.use('/ratings', ratingsRoutes);

app.get('/categories/:id', async function(req, res) {
    try {
        const listings = await listingModel.getListingsByCategory(req.params.id);
        const categories = await listingModel.getAllCategories();

        res.render('listings', {
            title: 'Listings',
            listings,
            categories,
            selectedCategory: Number(req.params.id),
            searchTerm: ''
        });
    } catch (err) {
        console.error('Category listings error:', err);
        res.status(500).send('Error loading category listings');
    }
});

app.listen(3000, function() {
    console.log('ClosetSwap running at http://127.0.0.1:3000/');
});
