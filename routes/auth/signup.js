import express from "express";
import { registerUser } from "../../controllers/authController.js";
// Creates a mini-router (a sub-app).
// Instead of writing all routes in one big file, we split them into modular routers.
// const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    // Calls the real logic from your authController.js
    // registerUser takes req.body (email, password, username, userId)
    // await waits for it to finish (because it connects to MongoDB)

    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
