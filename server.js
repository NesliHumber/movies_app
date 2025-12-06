// server.js
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");

// Vercel-optimized MongoDB connection
const connectDB = require("./lib/db");

const app = express();

// Connect to MongoDB (optimized for Vercel serverless)
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

// Globals for EJS
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

// Home page
app.get("/", (req, res) => {
  res.render("home");
});

// ====== PORT (local only) ======
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app; // IMPORTANT for Vercel serverless
