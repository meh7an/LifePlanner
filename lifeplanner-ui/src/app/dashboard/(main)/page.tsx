"use client";

import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import CalendarGrid from "../../../components/CalendarGrid";
import WeekView from "../../../components/WeekView";
import TodayOverview from "../../../components/TodayOverview";
import RightPanel from "../../../components/RightPanel";

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function DashboardPage() {
  const [view, setView] = useState<"month" | "week" | "today">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [panelContent, setPanelContent] = useState<string | null>(null);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Sidebar */}
      <Sidebar onSelect={(label) => setPanelContent(label)} />

      {/* Main + Right Panel */}
      <main className="flex-1 flex flex-row">
        {/* Central Column */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="px-6 py-3 bg-[#fdfdfb] dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between relative">
            {/* Left: Month and Week */}
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-medium text-gray-800 dark:text-gray-100">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                · Week {getWeekNumber(selectedDate)}
              </span>
            </div>

            {/* Right: Arrows and View Dropdown */}
            <div className="flex items-center gap-3">
              {/* ← Arrow */}
              <button
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate() - 7
                    )
                  )
                }
                className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
              >
                ←
              </button>

              {/* → Arrow */}
              <button
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate() + 7
                    )
                  )
                }
                className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
              >
                →
              </button>

              {/* View Dropdown */}
              <div className="relative z-50">
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                  className="px-4 py-1 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-100 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {view === "month"
                    ? "Month"
                    : view === "week"
                    ? "Week"
                    : "Today View"}{" "}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-36 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm z-50">
                    {["month", "week", "today"].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setView(v as "month" | "week" | "today");
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                          view === v
                            ? "text-red-400 font-medium"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {v === "month"
                          ? "Month"
                          : v === "week"
                          ? "Week"
                          : "Today View"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Calendar Section */}
          <section className="pt-2 pl-4 pr-4 pb-0 flex-1 overflow-y-auto">
            {view === "month" && <CalendarGrid />}
            {view === "week" && <WeekView selectedDate={selectedDate} />}
            {view === "today" && <TodayOverview />}
          </section>
        </div>

        {/* Right Panel (only if open) */}
        {panelContent && (
          <RightPanel
            content={panelContent}
            onClose={() => setPanelContent(null)}
          />
        )}
      </main>
    </div>
  );
}
