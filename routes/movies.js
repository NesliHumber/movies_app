const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");

// Auth middleware
function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "You must be logged in.");
    return res.redirect("/login");
  }
  next();
}

// Ownership middleware
async function isOwner(req, res, next) {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    req.flash("error", "Movie not found.");
    return res.redirect("/movies");
  }
  // Compare creator with logged in user
  if (!req.session.user || movie.createdBy.toString() !== req.session.user._id) {
    req.flash("error", "You are not allowed to edit/delete this movie.");
    return res.redirect("/movies");
  }
  // Attach to req for later use
  req.movie = movie;
  next();
}

// ====== Create form to collect data & render errors =====
// GET /movies/new – form for adding movie (restricted to logged in user)
router.get("/new", isLoggedIn, (req, res) => {
  res.render("movies/new", { errors: [], old: {} });
});

// ====== Add movie with validation =====
// POST /movies
router.post("/", isLoggedIn, async (req, res) => {
  const { name, description, year, genres, rating, posterUrl } = req.body;

  const errors = [];
  if (!name || name.trim() === "") errors.push("Name is required.");
  if (!description || description.trim() === "") errors.push("Description is required.");
  if (!year || isNaN(Number(year))) errors.push("Valid year is required.");
  if (!genres || genres.trim() === "") errors.push("At least one genre is required.");
  if (!rating || isNaN(Number(rating))) errors.push("Valid rating is required.");

  if (errors.length > 0) {
    return res.status(400).render("movies/new", {
      errors,
      old: req.body,
    });
  }

  try {
    const movie = new Movie({
      name,
      description,
      year: Number(year),
      genres: genres.split(",").map((g) => g.trim()),
      rating: Number(rating),
      posterUrl,
      createdBy: req.session.user._id,
    });
    await movie.save();
    req.flash("success", "Movie added successfully.");
    res.redirect("/movies");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error adding movie.");
    res.redirect("/movies/new");
  }
});

// ====== List movies =====
// GET /movies
router.get("/", async (req, res) => {
  const movies = await Movie.find().populate("createdBy", "username");
  res.render("movies/index", { movies });
});

// ====== Display movie details (id param) =====
// GET /movies/:id
router.get("/:id", async (req, res) => {
  const movie = await Movie.findById(req.params.id).populate("createdBy", "username");
  if (!movie) {
    req.flash("error", "Movie not found.");
    return res.redirect("/movies");
  }
  res.render("movies/show", { movie });
});

// ====== Edit movie details (id param) =====
// GET /movies/:id/edit
router.get("/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  res.render("movies/edit", { errors: [], movie: req.movie });
});

// PUT /movies/:id
router.put("/:id", isLoggedIn, isOwner, async (req, res) => {
  const { name, description, year, genres, rating, posterUrl } = req.body;

  const errors = [];
  if (!name || name.trim() === "") errors.push("Name is required.");
  if (!description || description.trim() === "") errors.push("Description is required.");
  if (!year || isNaN(Number(year))) errors.push("Valid year is required.");
  if (!genres || genres.trim() === "") errors.push("At least one genre is required.");
  if (!rating || isNaN(Number(rating))) errors.push("Valid rating is required.");

  if (errors.length > 0) {
    return res.status(400).render("movies/edit", {
      errors,
      movie: { ...req.body, _id: req.params.id },
    });
  }

  try {
    await Movie.findByIdAndUpdate(req.params.id, {
      name,
      description,
      year: Number(year),
      genres: genres.split(",").map((g) => g.trim()),
      rating: Number(rating),
      posterUrl,
    });
    req.flash("success", "Movie updated.");
    res.redirect(`/movies/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating movie.");
    res.redirect("/movies");
  }
});

// DELETE /movies/:id
router.delete("/:id", isLoggedIn, isOwner, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    req.flash("success", "Movie deleted.");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error deleting movie.");
  }
  res.redirect("/movies");
});

module.exports = router;
