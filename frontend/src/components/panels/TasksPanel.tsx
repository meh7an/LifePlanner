"use client";

import { useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Represents a single step within a task  helps break down complex work into manageable pieces
type TaskStep = {
  id: number;
  taskId: number;
  description: string;
  completed: boolean;
  orderIndex: number; // keeps steps in the right order
};

// Basic task priority levels  helps users focus on what's most important
type Priority = "high" | "medium" | "low";
type TaskStatus = "todo" | "in_progress" | "completed";

// Main task structure ir represents all the info we need to track for each task
type Task = {
  id: number;
  name: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null; // optional - not all tasks have deadlines
  boardName: string; // which board this task belongs to (like "University" or "Personal")
  listName: string; // which list within the board (like "Assignments" or "Projects")
  hasNotes: boolean; // whether this task has additional notes attached
  isRecurring: boolean; // whether this task repeats regularly
  completedSteps: number; // how many steps are done
  totalSteps: number; // total number of steps
  estimatedTime: number; // how long we think this will take (in minutes)
};

export default function TasksPanel() {
  // State management for all the interactive features
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSteps, setTaskSteps] = useState<TaskStep[]>([]);
  const [filter, setFilter] = useState<
    "all" | "today" | "overdue" | "completed"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set()); // tracks which tasks are showing their steps

  // Toggle whether a task's steps are visible or hidden
  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId); // collapse if already expanded
    } else {
      newExpanded.add(taskId); // expand if collapsed
    }
    setExpandedTasks(newExpanded);
  };

  // Mark a task as done or undone
  const toggleTaskStatus = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "completed" ? "todo" : "completed",
            }
          : task
      )
    );
  };

  // Handle checking/unchecking individual steps within a task
  const toggleStepStatus = (stepId: number) => {
    setTaskSteps((prev) => {
      const updatedSteps = prev.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      );

      // When a step changes, we need to update the parent task's progress
      const step = prev.find((s) => s.id === stepId);
      if (step) {
        // Count how many steps are now completed for this task
        const taskStepsForTask = updatedSteps.filter(
          (s) => s.taskId === step.taskId
        );
        const completedCount = taskStepsForTask.filter(
          (s) => s.completed
        ).length;

        // Update the task's completed steps count
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === step.taskId
              ? { ...task, completedSteps: completedCount }
              : task
          )
        );
      }

      return updatedSteps;
    });
  };

  // Get all steps for a specific task, sorted in the right order
  const getTaskSteps = (taskId: number) => {
    return taskSteps
      .filter((step) => step.taskId === taskId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  // Visual indicator colors for different priority levels
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500"; // red stripe for urgent tasks
      case "medium":
        return "bg-yellow-500"; // yellow for medium priority
      case "low":
        return "bg-green-500"; // green for low priority
    }
  };

  // Check if a task is past its due date
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Check if a task is due today
  const isToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  // Filter tasks based on the selected filter and board
  const filteredTasks = tasks.filter((task) => {
    // First filter by board if one is selected
    if (selectedBoard !== "all" && task.boardName !== selectedBoard)
      return false;

    // Then apply the status/date filter
    switch (filter) {
      case "today":
        return isToday(task.dueDate);
      case "overdue":
        return isOverdue(task.dueDate) && task.status !== "completed";
      case "completed":
        return task.status === "completed";
      default:
        return true; // "all" shows everything
    }
  });

  // Get unique board names for the filter dropdown
  const boards = Array.from(new Set(tasks.map((t) => t.boardName)));

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 font-medium min-w-0"
            >
              <option value="all">All Boards</option>
              {boards.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>

            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value as "all" | "today" | "overdue" | "completed"
                )
              }
              className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 font-medium min-w-0"
            >
              <option value="all">All Tasks</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const steps = getTaskSteps(task.id);
            const isExpanded = expandedTasks.has(task.id);
            const hasSteps = steps.length > 0;

            return (
              <div key={task.id} className="space-y-0">
                {/* Main Task */}
                <div
                  className={`relative p-3 rounded-lg border transition-all hover:shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                    task.status === "completed" ? "opacity-60" : ""
                  } ${
                    isExpanded && hasSteps ? "rounded-b-none border-b-0" : ""
                  }`}
                >
                  {/* Priority Indicator */}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(
                      task.priority
                    )} ${
                      isExpanded && hasSteps
                        ? "rounded-bl-none"
                        : "rounded-l-lg"
                    }`}
                  />

                  {/* Task Content */}
                  <div className="pl-3">
                    {/* Task Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 hover:scale-105 transition-transform flex-shrink-0"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-medium text-sm truncate max-w-[120px] ${
                              task.status === "completed"
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : "text-gray-800 dark:text-gray-100"
                            }`}
                            title={task.name}
                          >
                            {task.name}
                          </h3>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {task.isRecurring && (
                              <div
                                className="w-2 h-2 rounded-full bg-blue-500"
                                title="Recurring"
                              />
                            )}
                            {task.hasNotes && (
                              <div
                                className="w-2 h-2 rounded-full bg-purple-500"
                                title="Has notes"
                              />
                            )}
                          </div>

                          {/* Expand/Collapse Button */}
                          {hasSteps && (
                            <button
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Task Meta - Better spacing */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
                          <span
                            className="truncate max-w-[80px]"
                            title={`${task.boardName} • ${task.listName}`}
                          >
                            {task.boardName} • {task.listName}
                          </span>

                          {task.dueDate && (
                            <div
                              className={`flex items-center gap-1 flex-shrink-0 ${
                                isOverdue(task.dueDate) &&
                                task.status !== "completed"
                                  ? "text-red-500 dark:text-red-400"
                                  : isToday(task.dueDate)
                                  ? "text-orange-500 dark:text-orange-400"
                                  : ""
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedTime}m</span>
                          </div>
                        </div>

                        {/* Progress Bar - Only if multi-step */}
                        {task.totalSteps > 1 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {task.completedSteps}/{task.totalSteps} steps
                              </span>
                              <span>
                                {Math.round(
                                  (task.completedSteps / task.totalSteps) * 100
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    (task.completedSteps / task.totalSteps) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Steps */}
                {isExpanded && hasSteps && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg p-3 ml-1">
                    <div className="space-y-2">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition"
                        >
                          <button
                            onClick={() => toggleStepStatus(step.id)}
                            className="flex-shrink-0 hover:scale-105 transition-transform mt-0.5"
                          >
                            {step.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm block ${
                                step.completed
                                  ? "line-through text-gray-500 dark:text-gray-400"
                                  : "text-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {index + 1}. {step.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Circle className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tasks found</p>
              <p className="text-xs mt-1 opacity-75">
                Try changing your filter or create a new task
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats - Fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {tasks.filter((t) => t.status !== "completed").length}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">
              Active
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {tasks.filter((t) => t.status === "completed").length}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1 font-medium">
              Done
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {
                tasks.filter(
                  (t) => isOverdue(t.dueDate) && t.status !== "completed"
                ).length
              }
            </div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">
              Overdue
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium" as Priority,
    dueDate: "",
    board: "",
    list: "",
    estimatedTime: 60,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl w-[90%] max-w-md shadow-xl max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Complete project report"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what needs to be done..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
                Board
              </label>
              <select
                value={formData.board}
                onChange={(e) =>
                  setFormData({ ...formData, board: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>University</option>
                <option>Personal</option>
                <option>Work</option>
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
                List
              </label>
              <select
                value={formData.list}
                onChange={(e) =>
                  setFormData({ ...formData, list: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>Assignments</option>
                <option>Study</option>
                <option>Projects</option>
                <option>Routine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Priority,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
                Est. Time (min)
              </label>
              <input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedTime: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="15"
                step="15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300 font-medium">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (formData.name.trim()) {
                  // Here you would save the task
                  console.log("Creating task:", formData);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
