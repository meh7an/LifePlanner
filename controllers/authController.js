import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

//  Takes the incoming data (from the body of the /signup request)

export const registerUser = async (userData) => {
  const { email, password, username, userId } = userData;

  // Checks if the user already signed up
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  //  Uses bcrypt to: generate a random string
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Creates and saves the user, but saves the hashed password, not the real one.
  const user = new User({
    userId,
    username,
    email,
    password: hashedPassword,
  });

  await user.save();
  //  Sends back a success message — you can customize this later if you want to return user info too.
  return { message: "User registered successfully" };
};

// LOGIN user
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid credentials");
  }
  // Compares the password the user typed with the hashed password in MongoDB
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // If password is correct, create a JWT token using:

  // userId + email as the payload

  // A secret key from .env

  // Expires in 1 day

  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  // Returns the token and user info (but not the password) to the frontend
  return {
    token,
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
    },
  };
};
