import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

export default connectToDatabase;
