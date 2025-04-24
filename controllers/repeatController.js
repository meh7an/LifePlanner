import Repeat from "../models/Repeat.js";

// CREATE repeat rule for a task
export const createRepeat = async (repeatData) => {
  const repeat = new Repeat(repeatData);
  return await repeat.save();
};

// READ: Get repeat rule for a specific task
export const getRepeatsByTask = async (taskId) => {
  return await Repeat.find({ taskId });
};

// UPDATE repeat rule by repeatId
export const updateRepeat = async (repeatId, updateData) => {
  return await Repeat.findOneAndUpdate({ repeatId }, updateData, { new: true });
};

// DELETE repeat rule by repeatId
export const deleteRepeat = async (repeatId) => {
  return await Repeat.findOneAndDelete({ repeatId });
};
