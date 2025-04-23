import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
  memoryId: { type: String, required: true, unique: true },
  postId: { type: String, required: true }, // linked to Post

  createdAt: { type: Date, default: Date.now },
  tags: [{ type: String }], // optional tags like "Graduation", "Milestone"
});
const Memory = mongoose.model("Memory", taskSchema);
export default Memory;
