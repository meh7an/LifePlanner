import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // who did the session
  taskId: { type: String, required: true }, // which task it's linked to

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },

  isCompleted: { type: Boolean, default: false },
});
const FocusSession = mongoose.model("FocusSession", taskSchema);
export default FocusSession;
