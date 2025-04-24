import User from "../models/User.js";

// CREATE a user
export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

// GET a user by email
export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// UPDATE user profile
export const updateUser = async (userId, updateData) => {
  return await User.findOneAndUpdate({ userId }, updateData, { new: true });
};

// DELETE user
export const deleteUser = async (userId) => {
  return await User.findOneAndDelete({ userId });
};
