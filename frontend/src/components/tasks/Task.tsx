// =============================================================================
// ✅ COMPLETE TASK MANAGEMENT SYSTEM - components/tasks/TaskComponents.tsx
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Filter,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckSquare,
  MessageSquare,
  X,
  ChevronDown,
  List,
  Grid3X3,
  Menu,
} from "lucide-react";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
} from "date-fns";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useUIStore } from "@/lib/stores/uiStore";
import type { Task, Board, TaskFilters } from "@/lib/types";

// =============================================================================
// 🎯 VALIDATION SCHEMAS
// =============================================================================

const taskSchema = z.object({
  taskName: z
    .string()
    .min(1, "Task name is required")
    .max(200, "Task name must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  dueTime: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  boardId: z.string().min(1, "Please select a board"),
  listId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// =============================================================================
// 📝 TASK CREATION MODAL
// =============================================================================

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  boardId?: string;
  listId?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task = null,
  boardId: defaultBoardId,
  listId: defaultListId,
}) => {
  const { createTask, updateTask, createLoading, updateLoading } =
    useTaskStore();
  const { boards } = useBoardStore();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskName: task?.taskName || "",
      description: task?.description || "",
      dueTime: task?.dueTime ? parseISO(task.dueTime).toISOString() : "",
      priority: task?.priority || "medium",
      boardId: task?.boardId || defaultBoardId || "",
      listId: task?.listId || defaultListId || "",
    },
  });

  const watchedBoardId = watch("boardId");

  // Update selected board when boardId changes
  useEffect(() => {
    if (watchedBoardId) {
      const board = boards.find((b) => b.id === watchedBoardId);
      setSelectedBoard(board || null);
    }
  }, [watchedBoardId, boards]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          taskName: task.taskName,
          description: task.description || "",
          dueTime: task.dueTime ? parseISO(task.dueTime).toISOString() : "",
          priority: task.priority,
          boardId: task.boardId,
          listId: task.listId || "",
        });
      } else {
        reset({
          taskName: "",
          description: "",
          dueTime: "",
          priority: "medium",
          boardId: defaultBoardId || "",
          listId: defaultListId || "",
        });
      }
    }
  }, [isOpen, task, defaultBoardId, defaultListId, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (task) {
        // Update existing task
        const success = await updateTask(task.id, {
          taskName: data.taskName,
          description: data.description || undefined,
          dueTime:
            (data.dueTime ? parseISO(data.dueTime).toISOString() : undefined) ||
            undefined,
          priority: data.priority,
          listId: data.listId || undefined,
        });
        if (success) {
          onClose();
        }
      } else {
        // Create new task
        const success = await createTask({
          taskName: data.taskName,
          description: data.description || undefined,
          dueTime:
            (data.dueTime ? parseISO(data.dueTime).toISOString() : undefined) ||
            undefined,
          priority: data.priority,
          boardId: data.boardId,
          listId: data.listId || undefined,
        });
        if (success) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error submitting task:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {task ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Name *
            </label>
            <input
              {...register("taskName")}
              type="text"
              className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="What needs to be done?"
            />
            {errors.taskName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.taskName.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder="Add more details about this task..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Board and List Selection - Stacked on Mobile */}
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {/* Board Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Board *
              </label>
              <select
                {...register("boardId")}
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a board</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
              {errors.boardId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.boardId.message}
                </p>
              )}
            </div>

            {/* List Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                List (Optional)
              </label>
              <select
                {...register("listId")}
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={!selectedBoard}
              >
                <option value="">No specific list</option>
                {selectedBoard?.lists?.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date and Priority - Stacked on Mobile */}
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date & Time
              </label>
              <input
                {...register("dueTime")}
                type="datetime-local"
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Form Actions - Full width buttons on mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || createLoading || updateLoading}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {(createLoading || updateLoading) && (
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>{task ? "Update Task" : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// 🔍 TASK FILTERS COMPONENT
// =============================================================================

interface TaskFiltersProps {
  onFiltersChange: (filters: TaskFilters) => void;
  activeFilters: TaskFilters;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  onFiltersChange,
  activeFilters,
}) => {
  const { boards } = useBoardStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string | undefined) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) => activeFilters[key as keyof TaskFilters]
  ).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
          Filters
        </span>
        {activeFilterCount > 0 && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Filter panel */}
          <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:top-12 sm:left-0 sm:bottom-auto sm:right-auto bg-white dark:bg-gray-800 border-t sm:border border-gray-200 dark:border-gray-700 rounded-t-lg sm:rounded-lg shadow-lg z-50 w-full sm:w-80 max-h-[70vh] sm:max-h-none overflow-y-auto">
            {/* Mobile Handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between sm:hidden">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filters
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={
                    typeof activeFilters.completed === "boolean"
                      ? activeFilters.completed.toString()
                      : ""
                  }
                  onChange={(e) =>
                    handleFilterChange("completed", e.target.value || undefined)
                  }
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Tasks</option>
                  <option value="false">Active Tasks</option>
                  <option value="true">Completed Tasks</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={activeFilters.priority || ""}
                  onChange={(e) =>
                    handleFilterChange("priority", e.target.value || undefined)
                  }
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Board Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Board
                </label>
                <select
                  value={activeFilters.boardId || ""}
                  onChange={(e) =>
                    handleFilterChange("boardId", e.target.value || undefined)
                  }
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Boards</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <select
                  value={activeFilters.dueDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value || undefined)
                  }
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Due Dates</option>
                  <option value="today">Due Today</option>
                  <option value="tomorrow">Due Tomorrow</option>
                  <option value="week">Due This Week</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
                <button
                  onClick={clearFilters}
                  className="w-full sm:w-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2 sm:py-0"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// 📋 TASK CARD COMPONENT
// =============================================================================

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  view: "list" | "grid";
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  view,
}) => {
  const { toggleTaskComplete } = useTaskStore();
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDueDate = (dueTime: string) => {
    const date = parseISO(dueTime);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM d");
  };

  const isDueSoon = (dueTime: string) => {
    const date = parseISO(dueTime);
    return isToday(date) || isTomorrow(date);
  };

  const isOverdue = (dueTime: string) => {
    const date = parseISO(dueTime);
    return isPast(date) && !isToday(date);
  };

  if (view === "list") {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow touch-manipulation">
        <div className="flex items-start space-x-3">
          {/* Completion Checkbox - Larger touch target */}
          <button
            onClick={() => toggleTaskComplete(task.id)}
            className={`w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
              task.completed
                ? "bg-green-500 border-green-500"
                : "border-gray-300 dark:border-gray-600 hover:border-green-500"
            }`}
          >
            {task.completed && (
              <svg
                className="w-4 h-4 sm:w-3 sm:h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3
                className={`font-medium text-gray-900 dark:text-white pr-2 ${
                  task.completed
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : ""
                }`}
              >
                {task.taskName}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {task.board && (
                  <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Grid3X3 className="w-3 h-3 mr-1" />
                    {task.board.name}
                  </span>
                )}
                {task.dueTime && (
                  <span
                    className={`flex items-center px-2 py-1 rounded ${
                      isOverdue(task.dueTime)
                        ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                        : isDueSoon(task.dueTime)
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDueDate(task.dueTime)}
                  </span>
                )}
              </div>

              {/* Actions Menu - Larger touch target */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                  <>
                    {/* Mobile backdrop */}
                    <div
                      className="fixed inset-0 z-30 sm:hidden"
                      onClick={() => setShowMenu(false)}
                    />

                    <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 py-1 min-w-36">
                      <button
                        onClick={() => {
                          onEdit(task);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(task.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 sm:py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile-specific: Steps and Notes count in separate row */}
            {(task.stepsCount || task.notesCount) && (
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {task.stepsCount && task.stepsCount > 0 && (
                  <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    {task.stepsCount} steps
                  </span>
                )}
                {task.notesCount && task.notesCount > 0 && (
                  <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {task.notesCount} notes
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view - Mobile optimized
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow touch-manipulation">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => toggleTaskComplete(task.id)}
          className={`w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            task.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
          }`}
        >
          {task.completed && (
            <svg
              className="w-4 h-4 sm:w-3 sm:h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <div className="relative ml-auto">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              {/* Mobile backdrop */}
              <div
                className="fixed inset-0 z-30 sm:hidden"
                onClick={() => setShowMenu(false)}
              />

              <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 py-1 min-w-36">
                <button
                  onClick={() => {
                    onEdit(task);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 sm:py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3
        className={`font-medium text-gray-900 dark:text-white mb-2 ${
          task.completed ? "line-through text-gray-500 dark:text-gray-400" : ""
        }`}
      >
        {task.taskName}
      </h3>

      {task.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
          {task.dueTime && (
            <span
              className={`text-xs flex items-center px-2 py-1 rounded ${
                isOverdue(task.dueTime)
                  ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : isDueSoon(task.dueTime)
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {formatDueDate(task.dueTime)}
            </span>
          )}
        </div>

        {task.board && (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
            <Grid3X3 className="w-3 h-3 mr-1" />
            {task.board.name}
          </div>
        )}

        {(task.stepsCount || task.notesCount) && (
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            {task.stepsCount && task.stepsCount > 0 && (
              <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                <CheckSquare className="w-3 h-3 mr-1" />
                {task.stepsCount}
              </span>
            )}
            {task.notesCount && task.notesCount > 0 && (
              <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                <MessageSquare className="w-3 h-3 mr-1" />
                {task.notesCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// 📋 MAIN TASK LIST COMPONENT
// =============================================================================

const TaskList: React.FC = () => {
  const {
    tasks,
    fetchTasks,
    deleteTask,
    filters,
    setFilters,
    pagination,
    loading,
  } = useTaskStore();

  const { modals, openModal, closeModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showMobileControls, setShowMobileControls] = useState(false);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query || undefined });
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  // Handle task edit
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    openModal("taskModal");
  };

  // Handle task delete
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedTask(null);
    closeModal("taskModal");
  };

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    const [newSortBy, newSortOrder] = sortValue.split("-");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as "asc" | "desc");
    fetchTasks({
      sortBy: newSortBy,
      sortOrder: newSortOrder as "asc" | "desc",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
      {/* Mobile-Optimized Header */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              Tasks
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
              Manage your tasks and stay productive
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile controls toggle */}
            <button
              onClick={() => setShowMobileControls(!showMobileControls)}
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => openModal("taskModal")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1 sm:space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Search Bar - Always visible */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile Controls Panel */}
        {showMobileControls && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TaskFilters
                onFiltersChange={handleFiltersChange}
                activeFilters={filters}
              />

              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setView("list")}
                  className={`flex-1 px-3 py-2 text-sm transition-colors flex items-center justify-center ${
                    view === "list"
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`flex-1 px-3 py-2 text-sm transition-colors flex items-center justify-center ${
                    view === "grid"
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full pl-3 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="createdAt-desc">Latest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="dueTime-asc">Due Date (Soonest)</option>
              <option value="dueTime-desc">Due Date (Latest)</option>
              <option value="priority-desc">High Priority First</option>
              <option value="taskName-asc">Name A-Z</option>
              <option value="taskName-desc">Name Z-A</option>
            </select>
          </div>
        )}

        {/* Desktop Controls - Hidden on mobile */}
        <div className="hidden sm:flex items-center space-x-4 px-6 pb-4">
          <TaskFilters
            onFiltersChange={handleFiltersChange}
            activeFilters={filters}
          />

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 text-sm transition-colors ${
                view === "list"
                  ? "bg-green-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 text-sm transition-colors ${
                view === "grid"
                  ? "bg-green-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="createdAt-desc">Latest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="dueTime-asc">Due Date (Soonest)</option>
              <option value="dueTime-desc">Due Date (Latest)</option>
              <option value="priority-desc">High Priority First</option>
              <option value="taskName-asc">Name A-Z</option>
              <option value="taskName-desc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Stats - Mobile optimized */}
        <div className="flex items-center justify-center sm:justify-start flex-wrap gap-3 sm:gap-6 px-4 sm:px-6 pb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
            Total:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {pagination?.totalCount || 0}
            </span>
          </span>
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
            Done:{" "}
            <span className="font-medium text-green-600 dark:text-green-400">
              {tasks.filter((t) => t.completed).length}
            </span>
          </span>
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
            Active:{" "}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {tasks.filter((t) => !t.completed).length}
            </span>
          </span>
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
            Overdue:{" "}
            <span className="font-medium text-red-600 dark:text-red-400">
              {
                tasks.filter(
                  (t) =>
                    t.dueTime &&
                    isPast(parseISO(t.dueTime)) &&
                    !isToday(parseISO(t.dueTime)) &&
                    !t.completed
                ).length
              }
            </span>
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Loading tasks...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {Object.keys(filters).length > 0
                ? "No tasks match your filters"
                : "No tasks yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">
              {Object.keys(filters).length > 0
                ? "Try adjusting your filters to see more tasks."
                : "Create your first task to get started with your productivity journey."}
            </p>
            <button
              onClick={() => openModal("taskModal")}
              className="inline-flex items-center px-4 py-3 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Task
            </button>
          </div>
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                : "space-y-3"
            }
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                view={view}
              />
            ))}
          </div>
        )}

        {/* Mobile-Optimized Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Mobile pagination */}
            <div className="sm:hidden flex items-center justify-between">
              <button
                onClick={() => fetchTasks({ page: pagination.currentPage - 1 })}
                disabled={pagination.currentPage <= 1}
                className="px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchTasks({ page: pagination.currentPage + 1 })}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(pagination.currentPage - 1) * 10 + 1} to{" "}
                {Math.min(pagination.currentPage * 10, pagination.totalCount)}{" "}
                of {pagination.totalCount} tasks
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    fetchTasks({ page: pagination.currentPage - 1 })
                  }
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    fetchTasks({ page: pagination.currentPage + 1 })
                  }
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={modals.taskModal}
        onClose={handleModalClose}
        task={selectedTask}
      />
    </div>
  );
};

// =============================================================================
// 🎯 TASK BOARD VIEW COMPONENT (Kanban Style)
// =============================================================================

const TaskBoard: React.FC = () => {
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { boards } = useBoardStore();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  // Handle status change
  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    await updateTask(taskId, { status: newStatus });
  };

  const statusColumns = [
    { key: "todo", title: "To Do", color: "gray" },
    { key: "in_progress", title: "In Progress", color: "blue" },
    { key: "completed", title: "Completed", color: "green" },
  ];

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    handleStatusChange(taskId, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
      {/* Mobile-Optimized Header */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Task Board
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              Visualize your workflow
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedBoard?.id || ""}
              onChange={(e) => {
                const board = boards.find((b) => b.id === e.target.value);
                setSelectedBoard(board || null);
              }}
              className="w-full sm:w-auto px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Boards</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Kanban Board */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Mobile: Scrollable horizontal layout, Desktop: Grid */}
        <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 h-full min-w-max sm:min-w-0">
          {statusColumns.map((column) => (
            <div
              key={column.key}
              className="flex flex-col w-80 sm:w-auto flex-shrink-0"
            >
              <div
                className={`flex items-center justify-between p-3 sm:p-4 rounded-t-lg ${
                  column.color === "gray"
                    ? "bg-gray-100 dark:bg-gray-700"
                    : column.color === "blue"
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : "bg-green-100 dark:bg-green-900/20"
                }`}
              >
                <h3
                  className={`font-semibold text-sm sm:text-base ${
                    column.color === "gray"
                      ? "text-gray-800 dark:text-gray-200"
                      : column.color === "blue"
                      ? "text-blue-800 dark:text-blue-200"
                      : "text-green-800 dark:text-green-200"
                  }`}
                >
                  {column.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    column.color === "gray"
                      ? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                      : column.color === "blue"
                      ? "bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                      : "bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300"
                  }`}
                >
                  {
                    tasksByStatus[column.key as keyof typeof tasksByStatus]
                      .length
                  }
                </span>
              </div>

              <div
                className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg p-3 sm:p-4 space-y-3 min-h-96 overflow-y-auto"
                onDrop={(e) => handleDrop(e, column.key as Task["status"])}
                onDragOver={handleDragOver}
              >
                {tasksByStatus[column.key as keyof typeof tasksByStatus].map(
                  (task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-move touch-manipulation"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task.id);
                      }}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                        {task.taskName}
                      </h4>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.dueTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(parseISO(task.dueTime), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
                {tasksByStatus[column.key as keyof typeof tasksByStatus]
                  .length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <div className="text-xs sm:text-sm">No tasks here</div>
                    <div className="text-xs mt-1 opacity-75">
                      Drag tasks to add them
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll indicator */}
        <div className="sm:hidden flex justify-center mt-4 space-x-1">
          {statusColumns.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 🚀 EXPORTS
// =============================================================================

const TaskComponents = {
  TaskList,
  TaskBoard,
  TaskModal,
  TaskCard,
  TaskFilters,
};

export default TaskComponents;
export { TaskList, TaskBoard };
