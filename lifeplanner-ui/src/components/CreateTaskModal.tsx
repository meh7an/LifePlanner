"use client";

import { useState } from "react";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (task: { name: string; start: Date; end: Date }) => void;
  selectedDate: Date;
}

export default function CreateTaskModal({
  visible,
  onClose,
  onCreate,
  selectedDate,
}: CreateTaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60); // default 1 hour

  if (!visible) return null;

  const endDate = new Date(selectedDate.getTime() + durationMinutes * 60000);

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

        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
            Duration
          </label>
          <select
            className="w-full px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>From:</strong>{" "}
          {selectedDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          <br />
          <strong>To:</strong>{" "}
          {endDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
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
                onCreate({ name: taskName, start: selectedDate, end: endDate });
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
