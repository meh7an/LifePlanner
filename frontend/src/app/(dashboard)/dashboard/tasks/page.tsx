// app/(dashboard)/tasks/page.tsx - Tasks page using our TaskList component
"use client";

import React, { useState } from "react";
import { TaskList, TaskBoard } from "@/components/tasks/Task";

export default function TasksPage() {
  const [view, setView] = useState<"list" | "board">("list");

  return (
    <div className="p-6">
      <div className="mb-6">
        {/* Title and subtitle */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Task Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
            Organize, prioritize, and complete your tasks efficiently
          </p>
        </div>

        {/* View Toggle - Mobile: Full width tabs, Desktop: Right aligned buttons */}
        <div className="sm:flex sm:justify-end">
          <div className="flex w-full sm:w-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-lg sm:bg-transparent sm:dark:bg-transparent sm:p-0 sm:space-x-2">
            <button
              onClick={() => setView("list")}
              className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-2 px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 ${
                view === "list"
                  ? "bg-white dark:bg-gray-700 sm:bg-gradient-to-r sm:from-green-500 sm:to-emerald-600 text-gray-900 dark:text-white sm:text-white shadow-sm sm:shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white sm:bg-white sm:dark:bg-gray-800 sm:text-gray-700 sm:dark:text-gray-300 sm:hover:bg-green-50 sm:dark:hover:bg-green-900/20 sm:border sm:border-gray-200 sm:dark:border-gray-700"
              }`}
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span>List</span>
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-2 px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 ${
                view === "board"
                  ? "bg-white dark:bg-gray-700 sm:bg-gradient-to-r sm:from-green-500 sm:to-emerald-600 text-gray-900 dark:text-white sm:text-white shadow-sm sm:shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white sm:bg-white sm:dark:bg-gray-800 sm:text-gray-700 sm:dark:text-gray-300 sm:hover:bg-green-50 sm:dark:hover:bg-green-900/20 sm:border sm:border-gray-200 sm:dark:border-gray-700"
              }`}
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
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span>Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render appropriate component based on view */}
      {view === "list" ? <TaskList /> : <TaskBoard />}
    </div>
  );
}
