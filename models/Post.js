const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // Author

  title: { type: String, required: true },
  description: { type: String },
  privacy: { type: String, enum: ["public", "private"], default: "private" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Automatically update timestamp
postSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Post", postSchema);
