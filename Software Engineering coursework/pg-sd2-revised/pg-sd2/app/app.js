const express = require("express");
const session = require("express-session");
const path = require("path");

var app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

const db = require("./services/db");

app.use(session({
    secret: process.env.SESSION_SECRET || "closetswap-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        httpOnly: true,
        secure: false
    }
}));

const { attachUser } = require("./middleware/auth");
app.use(attachUser);

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

app.get("/", async function (req, res) {
    try {
        const listings = await db.query(
            `SELECT l.id, l.title, l.price, l.size, l.condition,
                    l.image_url, l.user_id, l.status, l.created_at,
                    u.username AS seller,
                    c.name AS category
             FROM listings l
             JOIN users u ON l.user_id = u.id
             LEFT JOIN categories c ON l.category_id = c.id
             WHERE l.status = 'available'
             ORDER BY l.created_at DESC
             LIMIT 12`
        );
        res.render("index", { title: "Home", listings: listings });
    } catch (err) {
        console.error("Homepage error:", err);
        res.render("index", { title: "Home", listings: [] });
    }
});

app.use("/", authRoutes);
app.use("/users", userRoutes);

// Uncomment when listing routes are ready:
// const listingRoutes = require("./routes/listings");
// app.use("/listings", listingRoutes);

// Uncomment when category routes are ready:
// const categoryRoutes = require("./routes/categories");
// app.use("/categories", categoryRoutes);

app.listen(3000, function () {
    console.log("ClosetSwap running at http://127.0.0.1:3000/");
});

const ratingsRoutes = require("./routes/ratings");
app.use("/ratings", ratingsRoutes);