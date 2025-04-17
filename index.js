const connectToDatabase = require("./db");

// Load models
require("./models/User");
require("./models/Board");
require("./models/Task");

connectToDatabase().then(() => {
  console.log("📦 MongoDB connection test successful and User schema loaded");
  process.exit();
});
