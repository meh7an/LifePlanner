import mongoose from "mongoose";

const shareSchema = new mongoose.Schema({
  shareId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true }, // who is sharing
  sharedWithId: { type: String, required: true }, // who it’s shared with

  resourceType: { type: String, enum: ["task", "board"], required: true },
  resourceId: { type: String, required: true }, // taskId or boardId

  permission: { type: String, enum: ["view", "edit"], default: "view" },
  sharedAt: { type: Date, default: Date.now },
});

const Share = mongoose.model("Share", taskSchema);
export default Share;
