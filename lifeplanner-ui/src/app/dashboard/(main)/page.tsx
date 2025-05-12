"use client";

import { useState } from "react";
import CalendarGrid from "../../../components/CalendarGrid";
import WeekView from "../../../components/WeekView";
import Sidebar from "../../../components/Sidebar";

export default function DashboardPage() {
  const [view, setView] = useState<"month" | "week">("month");

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="space-x-2">
            <button
              onClick={() => setView("month")}
              className={`px-4 py-1 rounded-md ${
                view === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-1 rounded-md ${
                view === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              }`}
            >
              Week
            </button>
          </div>
        </header>

        {/* Dynamic Calendar Area */}
        <section className="p-6 flex-1 overflow-y-auto">
          {view === "month" ? <CalendarGrid /> : <WeekView />}
        </section>
      </main>
    </div>
  );
}
