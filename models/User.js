import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  status: {
    type: String,
    enum: ["online", "offline", "away"],
    default: "offline",
  },
  lastLogin: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
export default User;
