import Archive from "../models/Archive.js";
import Post from "../models/Post.js"; // To link posts with users

// CREATE an archive
export const createArchive = async (archiveData) => {
  const archive = new Archive(archiveData);
  return await archive.save();
};

// READ: Get all archived posts for a user
export const getArchivesByUser = async (userId) => {
  const userPosts = await Post.find({ userId });
  const postIds = userPosts.map((post) => post.postId);

  return await Archive.find({ postId: { $in: postIds } });
};

// UPDATE an archive by archiveId
export const updateArchive = async (archiveId, updateData) => {
  return await Archive.findOneAndUpdate({ archiveId }, updateData, {
    new: true,
  });
};

// DELETE an archive by archiveId
export const deleteArchive = async (archiveId) => {
  return await Archive.findOneAndDelete({ archiveId });
};
