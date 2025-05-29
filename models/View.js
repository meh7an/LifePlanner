import mongoose from "mongoose";

const viewSchema = new mongoose.Schema({
  viewId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // who owns this view

  viewType: {
    type: String,
    enum: ["day", "week", "month", "focus", "duration"],
    required: true,
  },

  isDefault: { type: Boolean, default: false },
  preferences: { type: mongoose.Schema.Types.Mixed }, // flexible object for storing settings
});

const View = mongoose.model("View", viewSchema);
export default View;
