"use client";
import TasksPanel from "./panels/TasksPanel";
import FocusPanel from "./panels/FocusPanel";
import ProfilePanel from "./panels/ProfilePanel";

export default function RightPanel({
  content,
  onClose,
}: {
  content: string;
  onClose: () => void;
}) {
  return (
    <aside className="w-[280px] h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {content}
        </h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-red-400 transition"
        >
          ✕
        </button>
      </div>

      <div className="text-sm text-gray-700 dark:text-gray-300">
        {content === "Tasks" && <TasksPanel />}
        {content === "Focus" && <FocusPanel />}
        {content === "Profile" && <ProfilePanel />}
        {content === "Settings" && (
          <p>Configure your planner preferences here.</p>
        )}
      </div>
    </aside>
  );
}
