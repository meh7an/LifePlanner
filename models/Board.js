const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
  boardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["work", "personal", "project", "other"],
    default: "other",
  },
  createdAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },

  ownerId: { type: String, required: true },
});

const Board = mongoose.model("Board", taskSchema);
export default Board;
