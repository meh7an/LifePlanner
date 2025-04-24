import Task from "../models/Task.js";

// CREATE a new task
export const createTask = async (taskData) => {
  const task = new Task(taskData);
  return await task.save();
};

// READ: Get all tasks for a specific user
export const getTasksByUser = async (userId) => {
  return await Task.find({ userId });
};

// UPDATE a task by taskId
export const updateTask = async (taskId, updateData) => {
  return await Task.findOneAndUpdate({ taskId }, updateData, { new: true });
};

// DELETE a task by taskId
export const deleteTask = async (taskId) => {
  return await Task.findOneAndDelete({ taskId });
};
