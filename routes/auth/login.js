import express from "express";
import { loginUser } from "../../controllers/authController.js";
// This creates a new "mini app" (a router) that handles just the /signup route.
// You’ll export this and attach it to your main app in index.js.
const router = express.Router();
// creating a POST endpoint called /signup
// That means when someone sends a POST request to /api/auth/signup, this function will run.

// req: request from the user (e.g., email, password)

// res: response sent back

router.post("/login", async (req, res) => {
  try {
    // we call registerUser() and pass it the body of the request
    const result = await loginUser(req.body);
    //If registration works, respond with:

    // HTTP status 201 Created

    // or the  JSON message like
    res.status(200).json(result); // this will include teh  token + user info
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

export default router;
