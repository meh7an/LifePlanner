"use client";

import { useState } from "react";

type Task = {
  id: number;
  name: string;
  completed: boolean;
};

const initialTasks: Task[] = [
  { id: 1, name: "Finish Lab Report", completed: false },
  { id: 2, name: "Review slides", completed: false },
  { id: 3, name: "Submit assignment", completed: true },
  { id: 4, name: "Clear inbox", completed: true },
];

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleComplete = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const inboxTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const renderTask = (task: Task) => (
    <label
      key={task.id}
      className="flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      <div className="flex items-center gap-3">
        <div
          onClick={() => toggleComplete(task.id)}
          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition ${
            task.completed
              ? "bg-blue-600 border-blue-600"
              : "border-gray-400 dark:border-gray-500"
          }`}
        >
          {task.completed && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <span
          className={`text-sm ${
            task.completed
              ? "line-through text-gray-400"
              : "text-gray-800 dark:text-gray-100"
          }`}
        >
          {task.name}
        </span>
      </div>
    </label>
  );

  return (
    <div className="overflow-y-auto max-h-[85vh] space-y-6 pr-2 text-sm">
      {/* Inbox */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300 text-sm">
          Inbox
        </h3>
        <div className="space-y-2">{inboxTasks.map(renderTask)}</div>
      </section>

      {/* Completed */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300 text-sm">
          Completed
        </h3>
        <div className="space-y-2">{completedTasks.map(renderTask)}</div>
      </section>
    </div>
  );
}
