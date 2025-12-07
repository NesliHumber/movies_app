// server.js
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");
const Movie = require("./models/Movie"); // ← IMPORTANT for home page search

// MongoDB (works on Vercel)
const connectDB = require("./lib/db");

const app = express();
connectDB();

// ====== MIDDLEWARE ======
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// Global vars for EJS
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.user;
  next();
});

// ====== ROUTES ======
const movieRoutes = require("./routes/movies");
const authRoutes = require("./routes/auth");

app.use("/", authRoutes);
app.use("/movies", movieRoutes);

// ====== HOME PAGE WITH SEARCH ======
app.get("/", async (req, res) => {
  const search = req.query.search || "";

  const searchRegex = new RegExp(search, "i");

  let movies = [];

  if (search) {
    movies = await Movie.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { genres: searchRegex },
        { year: !isNaN(Number(search)) ? Number(search) : undefined },
        { rating: !isNaN(Number(search)) ? Number(search) : undefined },
      ],
    }).lean();
  } else {
    movies = await Movie.find({}).lean();
  }

  res.render("home", { movies, search });
});

// ====== PORT (local only) ======
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

