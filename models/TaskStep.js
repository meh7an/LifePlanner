import mongoose from "mongoose";

const taskStepSchema = new mongoose.Schema({
  stepId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true }, // reference to the parent task

  description: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  order: { type: Number, default: 0 }, // to keep step sequence
});
const TaskStep = mongoose.model("TaskStep", taskStepSchema);
export default TaskStep;
