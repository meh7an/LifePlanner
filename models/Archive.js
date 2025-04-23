const mongoose = require("mongoose");

const archiveSchema = new mongoose.Schema({
  archiveId: { type: String, required: true, unique: true },
  postId: { type: String, required: true }, // linked to Post

  archiveDate: { type: Date, default: Date.now },
  category: { type: String }, // e.g., "old project", "past event", etc.
});

const Archive = mongoose.model("Archive", taskSchema);
export default Archive;
