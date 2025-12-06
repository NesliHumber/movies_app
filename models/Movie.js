// models/Movie.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    year: { type: Number, required: true },
    genres: [{ type: String, required: true }],
    rating: { type: Number, min: 0, max: 10, required: true },
    posterUrl: { type: String }, // extra field

    // For requirement 12: who created it
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
