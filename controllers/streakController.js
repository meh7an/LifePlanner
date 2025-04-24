import Streak from "../models/Streak.js";

// CREATE a new streak tracker
export const createStreak = async (streakData) => {
  const streak = new Streak(streakData);
  return await streak.save();
};

// READ: Get all streaks for a user
export const getStreaksByUser = async (userId) => {
  return await Streak.find({ userId });
};

// UPDATE streak (e.g., currentCount or longestStreak)
export const updateStreak = async (streakId, updateData) => {
  return await Streak.findOneAndUpdate({ streakId }, updateData, { new: true });
};

// DELETE a streak by streakId
export const deleteStreak = async (streakId) => {
  return await Streak.findOneAndDelete({ streakId });
};
