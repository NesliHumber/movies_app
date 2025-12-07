const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Registration form
router.get("/register", (req, res) => {
  res.render("auth/register", { errors: [], old: {} });
});

// Registration with validation
router.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!username || username.trim() === "") errors.push("Username is required.");
  if (!email || email.trim() === "") errors.push("Email is required.");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters.");
  if (password !== confirmPassword) errors.push("Passwords do not match.");

  if (errors.length > 0) {
    return res.status(400).render("auth/register", {
      errors,
      old: { username, email },
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      errors.push("User with this email or username already exists.");
      return res.status(400).render("auth/register", {
        errors,
        old: { username, email },
      });
    }

    const user = new User({ username, email, passwordHash: "" });
    await user.setPassword(password);
    await user.save();

    req.flash("success", "Registration successful. Please log in.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error during registration.");
    res.redirect("/register");
  }
});

// Login form
router.get("/login", (req, res) => {
  res.render("auth/login", { errors: [], old: {} });
});

// Login with validation
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || !password) {
    errors.push("Both username and password are required.");
    return res.status(400).render("auth/login", { errors, old: { username } });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      errors.push("Invalid username or password.");
      return res.status(400).render("auth/login", { errors, old: { username } });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      errors.push("Invalid username or password.");
      return res.status(400).render("auth/login", { errors, old: { username } });
    }

    // Save user in session
    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    req.flash("success", `Welcome back, ${user.username}!`);
    res.redirect("/movies");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error logging in.");
    res.redirect("/login");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
