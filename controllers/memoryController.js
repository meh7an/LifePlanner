import Memory from "../models/Memory.js";
import Post from "../models/Post.js"; // Needed to trace post ownership

// CREATE a new memory
export const createMemory = async (memoryData) => {
  const memory = new Memory(memoryData);
  return await memory.save();
};

// READ: Get all memories for a user (through their posts)
export const getMemoriesByUser = async (userId) => {
  // Find user's posts
  const userPosts = await Post.find({ userId });
  const postIds = userPosts.map((post) => post.postId);

  // Find memories linked to those posts
  return await Memory.find({ postId: { $in: postIds } });
};

// UPDATE a memory by memoryId
export const updateMemory = async (memoryId, updateData) => {
  return await Memory.findOneAndUpdate({ memoryId }, updateData, { new: true });
};

// DELETE a memory by memoryId
export const deleteMemory = async (memoryId) => {
  return await Memory.findOneAndDelete({ memoryId });
};
