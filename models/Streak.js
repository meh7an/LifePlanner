import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
  streakId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // who owns the streak

  currentCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  type: { type: String, enum: ["task", "focus", "calendar"], required: true },

  longestStreak: { type: Number, default: 0 },
});
const Streak = mongoose.model("Streak", streakSchema);
export default Streak;
