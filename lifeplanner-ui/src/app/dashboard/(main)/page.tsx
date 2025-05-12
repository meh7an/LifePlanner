"use client";

import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import CalendarGrid from "../../../components/CalendarGrid";
import WeekView from "../../../components/WeekView";
import TodayOverview from "../../../components/TodayOverview";

export default function DashboardPage() {
  const [view, setView] = useState<"month" | "week" | "today">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
          <div className="text-xl font-semibold">
            {selectedDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </div>

          <div className="space-x-2 flex items-center">
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
            <button
              onClick={() => setView("today")}
              className={`px-4 py-1 rounded-md ${
                view === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              }`}
            >
              Today View
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Today
            </button>
          </div>
        </header>

        {/* Calendar Section */}
        <section className="p-6 flex-1 overflow-y-auto">
          {view === "month" && <CalendarGrid />}
          {view === "week" && <WeekView />}
          {view === "today" && <TodayOverview />}
        </section>
      </main>
    </div>
  );
}
