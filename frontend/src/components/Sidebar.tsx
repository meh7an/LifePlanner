"use client";

import { List, User, Settings, Timer } from "lucide-react";

export default function Sidebar({
  onSelect,
}: {
  onSelect: (label: string) => void;
}) {
  const navItems = [
    { label: "Tasks", icon: <List className="w-5 h-5" /> },
    { label: "Focus", icon: <Timer className="w-5 h-5" /> },
    { label: "Profile", icon: <User className="w-5 h-5" /> },
    { label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-6">
      {/* Logo */}
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">
        日
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col gap-6 mt-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item.label)}
            className="group relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={item.label}
          >
            {item.icon}
            <span className="sr-only">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
