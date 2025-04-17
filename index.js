const connectToDatabase = require("./db");

// Load models
require("./models/User");
require("./models/Board");

connectToDatabase().then(() => {
  console.log("📦 MongoDB connection test successful and User schema loaded");
  process.exit();
});
