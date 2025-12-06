// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");

const app = express();

// ====== DB CONNECTION ======
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/movies_app")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ====== MIDDLEWARE ======
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "supersecret", // in real apps, use env
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// Globals for EJS (flash + current user)
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.user; // we'll set this on login
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

// ====== PORT ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
