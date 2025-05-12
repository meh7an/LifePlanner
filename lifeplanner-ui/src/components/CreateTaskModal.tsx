"use client";

import { useState } from "react";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (task: { name: string }) => void;
  selectedDate: Date;
}

export default function CreateTaskModal({
  visible,
  onClose,
  onCreate,
  selectedDate,
}: CreateTaskModalProps) {
  const [taskName, setTaskName] = useState("");

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[90%] max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Create Task
        </h2>

        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
            Task Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g. Web Programming"
          />
        </div>

        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <strong>Start:</strong> {selectedDate.toLocaleString()}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-1 bg-gray-300 dark:bg-gray-600 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            onClick={() => {
              if (taskName.trim()) {
                onCreate({ name: taskName });
                setTaskName("");
              }
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
