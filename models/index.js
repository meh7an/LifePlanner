// index.js
const connectToDatabase = require("./db");

connectToDatabase().then(() => {
  console.log("📦 MongoDB connection test successful");
  process.exit(); // close after testing
});
