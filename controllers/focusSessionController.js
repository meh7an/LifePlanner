import FocusSession from "../models/FocusSession.js";

// CREATE a new focus session
export const createFocusSession = async (sessionData) => {
  const session = new FocusSession(sessionData);
  return await session.save();
};

// READ: Get all focus sessions for a user
export const getFocusSessionsByUser = async (userId) => {
  return await FocusSession.find({ userId });
};

// UPDATE a focus session by sessionId
export const updateFocusSession = async (sessionId, updateData) => {
  return await FocusSession.findOneAndUpdate({ sessionId }, updateData, {
    new: true,
  });
};

// DELETE a focus session by sessionId
export const deleteFocusSession = async (sessionId) => {
  return await FocusSession.findOneAndDelete({ sessionId });
};
