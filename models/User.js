// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  status: {
    type: String,
    enum: ["online", "offline", "away"],
    default: "offline",
  },
  lastLogin: { type: Date, default: Date.now },
});

// Create index on email and userId
// userSchema.index({ email: 1 }, { unique: true });
// userSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
