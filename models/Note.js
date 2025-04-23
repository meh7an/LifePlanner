import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  noteId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true }, // link to Task

  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt automatically
noteSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});
const Note = mongoose.model("Note", taskSchema);
export default Note;
