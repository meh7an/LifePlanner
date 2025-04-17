const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },

  dueDate: { type: Date },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["todo", "in progress", "done"],
    default: "todo",
  },

  isCompleted: { type: Boolean, default: false },
  isNew: { type: Boolean, default: true },

  userId: { type: String, required: true },
  boardId: { type: String, required: true },
  listId: { type: String },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", taskSchema);
