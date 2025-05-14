import express from "express";
import { createTask } from "../controllers/taskController.js";

const router = express.Router();

// Handle POST request to create a new task
router.post("/", async (req, res) => {
  try {
    console.log(" Incoming task data:", req.body);

    const task = await createTask(req.body);

    console.log("✅ Task saved:", task);
    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Error saving task:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
