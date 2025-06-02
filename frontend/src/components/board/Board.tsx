// =============================================================================
// 📋 LIFE PLANNER - COMPLETE BOARD MANAGEMENT SYSTEM
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import {
  Board,
  List,
  Task,
  CreateBoardRequest,
  CreateListRequest,
  BOARD_TYPES,
  TASK_STATUSES,
} from "@/lib/types";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { format, parseISO, isBefore, endOfDay } from "date-fns";

// =============================================================================
// 🎯 BOARD UTILITIES
// =============================================================================

const isOverdue = (date: Date) => {
  return isBefore(endOfDay(date), new Date());
};

const getBoardTypeIcon = (type: Board["type"]): string => {
  const icons = {
    work: "💼",
    personal: "🏠",
    project: "🚀",
    other: "📌",
  };
  return icons[type] || icons.other;
};

const getBoardTypeColor = (type: Board["type"]): string => {
  const colors = {
    work: "bg-blue-500",
    personal: "bg-purple-500",
    project: "bg-green-500",
    other: "bg-gray-500",
  };
  return colors[type] || colors.other;
};

const getPriorityColor = (priority: Task["priority"]): string => {
  const colors = {
    high: "border-l-red-500 bg-red-50 dark:bg-red-900/20",
    medium: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
    low: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
  };
  return colors[priority];
};

const getStatusColor = (status: Task["status"]): string => {
  const colors = {
    todo: "text-gray-600 bg-gray-100 dark:bg-gray-700",
    in_progress: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    completed: "text-green-600 bg-green-100 dark:bg-green-900/30",
    cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30",
  };
  return colors[status];
};

// =============================================================================
// 📋 BOARD MODAL COMPONENT
// =============================================================================

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board?: Board | null;
}

const BoardModal: React.FC<BoardModalProps> = ({ isOpen, onClose, board }) => {
  const { createBoard, updateBoard, deleteBoard } = useBoardStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState<CreateBoardRequest>({
    name: "",
    type: "personal",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name,
        type: board.type,
      });
    } else {
      setFormData({
        name: "",
        type: "personal",
      });
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (board) {
        if (!board.id) {
          setErrors({ general: "Board ID is required for updates." });
          return;
        }
        const success = await updateBoard(board.id, formData);
        if (success) {
          addNotification({
            id: crypto.randomUUID(),
            type: "system_announcement",
            title: "Board Updated! 📋",
            message: "Your board has been updated successfully.",
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });
          onClose();
        }
      } else {
        const success = await createBoard(formData);
        if (success) {
          addNotification({
            id: crypto.randomUUID(),
            type: "system_announcement",
            title: "Board Created! ✨",
            message: "Your new board is ready to organize your tasks.",
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });
          onClose();
        }
      }
    } catch (error) {
      console.error("Board save error:", error);
      setErrors({ general: "Failed to save board. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!board) return;

    if (
      !confirm(
        "Are you sure you want to delete this board? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteBoard(board.id);
      if (success) {
        addNotification({
          id: crypto.randomUUID(),
          type: "system_announcement",
          title: "Board Deleted! 🗑️",
          message: "The board has been removed from your workspace.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: "system",
        });
        onClose();
      }
    } catch (error) {
      console.error("Board delete error:", error);
      setErrors({ general: "Failed to delete board. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-green-100 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {board ? "Edit Board" : "Create Board"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.general}
              </p>
            </div>
          )}

          {/* Board Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Board Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Enter board name..."
              required
            />
          </div>

          {/* Board Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Board Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {BOARD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.type === type
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getBoardTypeIcon(type)}</span>
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {board && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Board
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading
                  ? "Saving..."
                  : board
                  ? "Update Board"
                  : "Create Board"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// 📝 LIST MODAL COMPONENT
// =============================================================================

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  list?: List | null;
}

const ListModal: React.FC<ListModalProps> = ({
  isOpen,
  onClose,
  boardId,
  list,
}) => {
  const { createList, updateList, deleteList } = useBoardStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState<CreateListRequest>({
    name: "",
    orderIndex: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name,
        orderIndex: list.orderIndex,
      });
    } else {
      setFormData({
        name: "",
        orderIndex: 0,
      });
    }
  }, [list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (list) {
        const success = await updateList(list.id, formData);
        if (success) {
          addNotification({
            id: crypto.randomUUID(),
            type: "system_announcement",
            title: "List Updated! 📝",
            message: "Your list has been updated successfully.",
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });
          onClose();
        }
      } else {
        const success = await createList(boardId, formData);
        if (success) {
          addNotification({
            id: crypto.randomUUID(),
            type: "system_announcement",
            title: "List Created! ✨",
            message: "Your new list is ready for tasks.",
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });
          onClose();
        }
      }
    } catch (error) {
      console.error("List save error:", error);
      setErrors({ general: "Failed to save list. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!list) return;

    if (
      !confirm(
        "Are you sure you want to delete this list? All tasks in this list will be moved to the default list."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteList(list.id);
      if (success) {
        addNotification({
          id: crypto.randomUUID(),
          type: "system_announcement",
          title: "List Deleted! 🗑️",
          message: "The list has been removed from your board.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: "system",
        });
        onClose();
      }
    } catch (error) {
      console.error("List delete error:", error);
      setErrors({ general: "Failed to delete list. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-green-100 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {list ? "Edit List" : "Create List"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.general}
              </p>
            </div>
          )}

          {/* List Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              List Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Enter list name..."
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {list && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete List
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Saving..." : list ? "Update List" : "Create List"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// 🃏 TASK CARD COMPONENT
// =============================================================================

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  className = "",
}) => {
  const isTaskOverdue = task.dueTime
    ? isOverdue(parseISO(task.dueTime))
    : false;

  const handleStatusChange = (newStatus: Task["status"]) => {
    onStatusChange(task.id, newStatus);
  };

  return (
    <div
      className={`${className} bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${getPriorityColor(
        task.priority
      )} hover:shadow-md transition-all cursor-pointer group`}
      onClick={() => onEdit(task)}
    >
      <div className="p-4">
        {/* Task Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4
              className={`font-medium text-gray-900 dark:text-white mb-1 ${
                task.completed
                  ? "line-through text-gray-500 dark:text-gray-400"
                  : ""
              }`}
            >
              {task.taskName}
            </h4>

            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Task Menu */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Task Meta */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {/* Priority */}
            <span
              className={`px-2 py-1 rounded-full font-medium ${
                task.priority === "high"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : task.priority === "medium"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {task.priority}
            </span>

            {/* Status */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {task.status.replace("_", " ")}
            </span>

            {/* Steps Count */}
            {task.stepsCount && task.stepsCount > 0 && (
              <span className="flex items-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {task.stepsCount}
              </span>
            )}

            {/* Notes Count */}
            {task.notesCount && task.notesCount > 0 && (
              <span className="flex items-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {task.notesCount}
              </span>
            )}
          </div>

          {/* Due Date */}
          {task.dueTime && (
            <span
              className={`font-medium ${
                isTaskOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {isTaskOverdue && "⚠️ "}
              {format(parseISO(task.dueTime), "MMM d")}
            </span>
          )}
        </div>

        {/* Quick Status Actions */}
        <div className="mt-3 flex gap-2">
          {TASK_STATUSES.map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(status);
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                task.status === status
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/20"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 📋 BOARD LIST COMPONENT
// =============================================================================

interface BoardListProps {
  list: List;
  tasks: Task[];
  onAddTask: (listId: string) => void;
  onEditList: (list: List) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: Task["status"]) => void;
  className?: string;
}

const BoardList: React.FC<BoardListProps> = ({
  list,
  tasks,
  onAddTask,
  onEditList,
  onEditTask,
  onDeleteTask,
  onTaskStatusChange,
  className = "",
}) => {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div
      className={`${className} bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 min-h-[500px] w-80 flex-shrink-0`}
    >
      {/* List Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {list.name}
          </h3>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
            {totalTasks}
          </span>
        </div>

        <button
          onClick={() => onEditList(list)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-3 mb-4 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onStatusChange={onTaskStatusChange}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-1">Add your first task to get started</p>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => onAddTask(list.id)}
        className="w-full p-3 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg text-green-600 dark:text-green-400 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-center space-x-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="font-medium">Add Task</span>
      </button>
    </div>
  );
};

// =============================================================================
// 📋 MAIN BOARD VIEW COMPONENT
// =============================================================================

interface BoardViewProps {
  board: Board;
  className?: string;
}

const BoardView: React.FC<BoardViewProps> = ({ board, className = "" }) => {
  const { selectedBoard, fetchBoard } = useBoardStore();

  const { tasks, updateTask, deleteTask } = useTaskStore();
  const { addNotification } = useUIStore();

  // Local state for modals only
  const [listModal, setListModal] = useState({
    isOpen: false,
    list: null as List | null,
  });

  useEffect(() => {
    // Fetch the full board details (including lists) when component mounts
    fetchBoard(board.id);
  }, [board.id, fetchBoard]);

  // Use selectedBoard from store (which has full details including lists)
  const currentBoard = selectedBoard?.id === board.id ? selectedBoard : board;
  const boardLists = currentBoard.lists || [];
  const boardTasks = tasks.filter((task) => task.boardId === board.id);

  const getTasksForList = (listId: string) => {
    return boardTasks.filter((task) => task.listId === listId);
  };

  // List handlers
  const handleCreateList = () => {
    setListModal({ isOpen: true, list: null });
  };

  const handleEditList = (list: List) => {
    setListModal({ isOpen: true, list });
  };

  const closeListModal = () => {
    setListModal({ isOpen: false, list: null });
  };

  // Task handlers
  const handleCreateTask = (listId: string) => {
    // Open task modal (would integrate with existing TaskModal)
    console.log("Creating task for list:", listId);
  };

  const handleEditTask = (task: Task) => {
    // Open task modal for editing
    console.log("Editing task:", task.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const success = await deleteTask(taskId);
      if (success) {
        addNotification({
          id: crypto.randomUUID(),
          type: "system_announcement",
          title: "Task Deleted! 🗑️",
          message: "The task has been removed successfully.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: "system",
        });
      }
    }
  };

  const handleTaskStatusChange = async (
    taskId: string,
    status: Task["status"]
  ) => {
    const success = await updateTask(taskId, {
      status,
      completed: status === "completed",
    });
    if (success) {
      addNotification({
        id: crypto.randomUUID(),
        type: status === "completed" ? "task_completed" : "system_announcement",
        title: status === "completed" ? "Task Completed! ✅" : "Status Updated",
        message: `Task status changed to ${status.replace("_", " ")}`,
        read: false,
        createdAt: new Date().toISOString(),
        userId: "system",
      });
    }
  };

  return (
    <div className={`${className}`}>
      {/* Board Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 ${getBoardTypeColor(
                board.type
              )} rounded-xl flex items-center justify-center text-2xl`}
            >
              {getBoardTypeIcon(board.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {board.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 capitalize">
                {board.type} board • {boardLists.length} lists •{" "}
                {boardTasks.length} tasks
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateList}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add List</span>
          </button>
        </div>

        {/* Board Stats - Use computed stats from current data */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {boardTasks.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Total Tasks
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {boardTasks.filter((t) => t.completed).length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Completed
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {
                boardTasks.filter(
                  (t) => !t.completed && t.status !== "cancelled"
                ).length
              }
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              In Progress
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {boardTasks.length > 0
                ? Math.round(
                    (boardTasks.filter((t) => t.completed).length /
                      boardTasks.length) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Completion Rate
            </div>
          </div>
        </div>
      </div>

      {/* Board Lists */}
      <div className="flex space-x-6 overflow-x-auto pb-6">
        {boardLists.map((list) => (
          <BoardList
            key={list.id}
            list={list}
            tasks={getTasksForList(list.id)}
            onAddTask={handleCreateTask}
            onEditList={handleEditList}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTaskStatusChange={handleTaskStatusChange}
          />
        ))}

        {/* Add List Card */}
        {boardLists.length === 0 ? (
          <div className="w-80 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Start organizing your tasks
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first list to start adding tasks and organizing your
              work.
            </p>
            <button
              onClick={handleCreateList}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create First List
            </button>
          </div>
        ) : (
          <div className="w-80 flex-shrink-0">
            <button
              onClick={handleCreateList}
              className="w-full h-32 border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl text-green-600 dark:text-green-400 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex flex-col items-center justify-center space-y-2"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">Add Another List</span>
            </button>
          </div>
        )}
      </div>

      {/* List Modal */}
      <ListModal
        isOpen={listModal.isOpen}
        onClose={closeListModal}
        boardId={board.id}
        list={listModal.list}
      />
    </div>
  );
};

// =============================================================================
// 📋 BOARDS GRID COMPONENT
// =============================================================================

interface BoardsGridProps {
  boards: Board[];
  onSelectBoard: (board: Board) => void;
  onCreateBoard: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string, boardName: string) => void; // Fixed signature
  className?: string;
}

const BoardsGrid: React.FC<BoardsGridProps> = ({
  boards,
  onSelectBoard,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
  className = "",
}) => {
  console.log("BoardsGrid rendered with boards:", boards);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Boards
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your tasks and projects with boards
          </p>
        </div>

        <button
          onClick={onCreateBoard}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Create Board</span>
        </button>
      </div>

      {/* Boards Grid */}
      {boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => onSelectBoard(board)}
            >
              {/* Board Header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 ${getBoardTypeColor(
                    board.type
                  )} rounded-xl flex items-center justify-center text-2xl`}
                >
                  {getBoardTypeIcon(board.type)}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBoard(board);
                    }}
                    className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                    title="Edit board"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBoard(board.id, board.name); // Fixed: now passes both boardId and boardName
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Delete board"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Board Info */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {board.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {board.type} board
                </p>
              </div>

              {/* Board Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    {board.lists?.length || 0}
                  </span>
                  <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {board.tasksCount || 0}
                  </span>
                </div>

                {board.completedTasksCount !== undefined &&
                  board.tasksCount &&
                  board.tasksCount > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(
                          (board.completedTasksCount / board.tasksCount) * 100
                        )}
                        % done
                      </div>
                    </div>
                  )}
              </div>

              {/* Progress Bar */}
              {board.completedTasksCount !== undefined &&
                board.tasksCount &&
                board.tasksCount > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (board.completedTasksCount / board.tasksCount) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

              {/* Created Date */}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Created {format(parseISO(board.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">📋</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No boards yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Create your first board to start organizing your tasks and projects
            into manageable lists.
          </p>
          <button
            onClick={onCreateBoard}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Create Your First Board
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 🎯 MAIN BOARD MANAGEMENT COMPONENT
// =============================================================================

interface BoardManagementProps {
  className?: string;
}

const BoardManagement: React.FC<BoardManagementProps> = ({
  className = "",
}) => {
  const { boards, loading, fetchBoards, deleteBoard } = useBoardStore();
  console.log("BoardManagement rendered with boards:", boards);

  const { addNotification } = useUIStore();

  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [boardModal, setBoardModal] = useState({
    isOpen: false,
    board: null as Board | null,
  });

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Navigation handlers
  const handleSelectBoard = (board: Board) => {
    setSelectedBoard(board);
  };

  const handleBackToBoards = () => {
    setSelectedBoard(null);
  };

  // Board CRUD handlers
  const handleCreateBoard = () => {
    setBoardModal({ isOpen: true, board: null });
  };

  const handleEditBoard = (board: Board) => {
    setBoardModal({ isOpen: true, board });
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    const confirmMessage = `Are you sure you want to delete "${boardName}"? This will also delete all lists and tasks in this board. This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      const success = await deleteBoard(boardId);
      if (success) {
        addNotification({
          id: crypto.randomUUID(),
          type: "system_announcement",
          title: "Board Deleted! 🗑️",
          message: `"${boardName}" and all its contents have been removed.`,
          read: false,
          createdAt: new Date().toISOString(),
          userId: "system",
        });

        // If we're currently viewing the deleted board, go back to boards list
        if (selectedBoard?.id === boardId) {
          setSelectedBoard(null);
        }
      }
    }
  };

  const closeBoardModal = () => {
    setBoardModal({ isOpen: false, board: null });
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse space-y-6`}>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {selectedBoard ? (
        <div>
          {/* Back Button */}
          <button
            onClick={handleBackToBoards}
            className="mb-6 flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back to Boards</span>
          </button>

          <BoardView board={selectedBoard} />
        </div>
      ) : (
        <BoardsGrid
          boards={boards}
          onSelectBoard={handleSelectBoard}
          onCreateBoard={handleCreateBoard}
          onEditBoard={handleEditBoard}
          onDeleteBoard={handleDeleteBoard}
        />
      )}

      {/* Board Modal */}
      <BoardModal
        isOpen={boardModal.isOpen}
        onClose={closeBoardModal}
        board={boardModal.board}
      />
    </div>
  );
};

// =============================================================================
// 🚀 EXPORT ALL COMPONENTS
// =============================================================================

export {
  BoardManagement as Boards,
  BoardView,
  BoardsGrid,
  BoardModal,
  ListModal,
  TaskCard,
  BoardList,
};

export default BoardManagement;
