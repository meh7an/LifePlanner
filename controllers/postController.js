import Post from "../models/Post.js";

// CREATE a new post
export const createPost = async (postData) => {
  const post = new Post(postData);
  return await post.save();
};

// READ: Get all posts for a user
export const getPostsByUser = async (userId) => {
  return await Post.find({ userId });
};

// UPDATE a post by postId
export const updatePost = async (postId, updateData) => {
  return await Post.findOneAndUpdate({ postId }, updateData, { new: true });
};

// DELETE a post by postId
export const deletePost = async (postId) => {
  return await Post.findOneAndDelete({ postId });
};
