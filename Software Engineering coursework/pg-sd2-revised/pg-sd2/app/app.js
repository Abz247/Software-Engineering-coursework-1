const express = require('express');
const session = require('express-session');
const path = require('path');

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

const usersRoutes = require('./routes/users');
const listingsRoutes = require('./routes/listings');
const authRoutes = require('./routes/auth');
const listingModel = require('./models/listingModel');

app.get('/', async function(req, res) {
    try {
        const listings = await listingModel.getAllListings();
        res.render('index', {
            heading: 'Welcome to ClosetSwap',
            listings: listings.slice(0, 8)
        });
    } catch (err) {
        console.error(err);
        res.render('index', { heading: 'Welcome to ClosetSwap', listings: [] });
    }
});

app.use('/', authRoutes);
app.use('/users', usersRoutes);
app.use('/listings', listingsRoutes);

app.get('/categories/:id', async (req, res) => {
    try {
        const listings = await listingModel.getListingsByCategory(req.params.id);
        const categories = await listingModel.getAllCategories();

        res.render('listings', {
            listings,
            categories,
            selectedCategory: Number(req.params.id),
            searchTerm: ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading category listings');
    }
});

app.listen(3000, function() {
    console.log('Server running at http://127.0.0.1:3000/');
});
