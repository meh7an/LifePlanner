"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
      <h2 className="text-xl font-semibold mb-6">Life Planner</h2>
      <nav className="space-y-4 text-sm">
        <Link
          href="/dashboard"
          className="block hover:text-blue-500 transition"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/tasks"
          className="block hover:text-blue-500 transition"
        >
          Tasks
        </Link>
        <Link
          href="/dashboard/calendar"
          className="block hover:text-blue-500 transition"
        >
          Calendar
        </Link>
        <Link
          href="/dashboard/focus"
          className="block hover:text-blue-500 transition"
        >
          Focus Sessions
        </Link>
        <Link
          href="/dashboard/posts"
          className="block hover:text-blue-500 transition"
        >
          Posts
        </Link>
        <Link
          href="/dashboard/notes"
          className="block hover:text-blue-500 transition"
        >
          Notes
        </Link>
        <Link
          href="/dashboard/settings"
          className="block hover:text-blue-500 transition"
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}
