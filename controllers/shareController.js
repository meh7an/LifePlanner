import Share from "../models/Share.js";

// CREATE a shared resource
export const createShare = async (shareData) => {
  const share = new Share(shareData);
  return await share.save();
};

// READ: Get all shared items created by a user
export const getSharesByOwner = async (ownerId) => {
  return await Share.find({ ownerId });
};

// UPDATE share permission (e.g., change view to edit)
export const updateSharePermission = async (shareId, newPermission) => {
  return await Share.findOneAndUpdate(
    { shareId },
    { permission: newPermission },
    { new: true }
  );
};

// DELETE a shared access
export const deleteShare = async (shareId) => {
  return await Share.findOneAndDelete({ shareId });
};
