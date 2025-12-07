const mongoose = require("mongoose");

let isConnected = false; // track the connection

async function connectDB() {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ Missing MONGODB_URI in environment variables.");
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // reduce hanging time
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected (Vercel-optimized)");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

module.exports = connectDB;
