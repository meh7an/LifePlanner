"use client";

import { useState, useEffect } from "react";

// Utility functions for calendar
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get the first day of the week for the first day of the month
  const startingDayOfWeek = firstDay.getDay();

  // Get days from previous month to fill the grid
  const daysFromPrevMonth = [];
  const prevMonth = new Date(year, month - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    daysFromPrevMonth.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  // Get days in current month
  const daysInCurrentMonth = [];
  for (let day = 1; day <= daysInMonth; day++) {
    daysInCurrentMonth.push(new Date(year, month, day));
  }

  // Get days from next month to fill remaining slots
  const totalCells = 42; // 6 rows × 7 days
  const daysFromNextMonth = [];
  const remainingCells =
    totalCells - daysFromPrevMonth.length - daysInCurrentMonth.length;

  for (let day = 1; day <= remainingCells; day++) {
    daysFromNextMonth.push(new Date(year, month + 1, day));
  }

  return [...daysFromPrevMonth, ...daysInCurrentMonth, ...daysFromNextMonth];
}

function getWeekDays(date: Date): Date[] {
  const week = [];
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day; // First day is Sunday
  startOfWeek.setDate(diff);

  for (let i = 0; i < 7; i++) {
    week.push(new Date(startOfWeek));
    startOfWeek.setDate(startOfWeek.getDate() + 1);
  }

  return week;
}

// Sidebar Component
const Sidebar = ({ onSelect }: { onSelect: (label: string) => void }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const sidebarItems = [
    { icon: "📋", label: "My Boards", badge: "3" },
    { icon: "✅", label: "Tasks", badge: "12" },
    { icon: "📅", label: "Calendar" },
    { icon: "⚡", label: "Focus", badge: "2h" },
    { icon: "🎯", label: "Goals" },
    { icon: "📊", label: "Analytics" },
    { icon: "🗂️", label: "Archives" },
    { icon: "👥", label: "Shared" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-green-100 dark:border-green-800/30 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-green-100 dark:border-green-800/30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Life Planner
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item.label)}
            className="w-full flex items-center justify-between px-4 py-3 text-left rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 font-medium">
                {item.label}
              </span>
            </div>
            {item.badge && (
              <span className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-green-100 dark:border-green-800/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">M</span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Mehran
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Premium Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Calendar Grid Component
const CalendarGrid = ({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) => {
  const days = getDaysInMonth(selectedDate);
  const today = new Date();
  const currentMonth = selectedDate.getMonth();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/30">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-4 text-center text-sm font-semibold text-green-700 dark:text-green-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isToday =
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear();

          const isCurrentMonth = day.getMonth() === currentMonth;
          const isSelected =
            day.getDate() === selectedDate.getDate() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getFullYear() === selectedDate.getFullYear();

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`
                h-20 p-2 border-b border-r border-gray-100 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors relative
                ${
                  !isCurrentMonth
                    ? "text-gray-400 dark:text-gray-600"
                    : "text-gray-900 dark:text-white"
                }
                ${isSelected ? "bg-green-100 dark:bg-green-900/30" : ""}
              `}
            >
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  isToday
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    : ""
                }
                ${
                  isSelected && !isToday
                    ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                    : ""
                }
              `}
              >
                {day.getDate()}
              </div>

              {/* Sample events/tasks */}
              {isCurrentMonth && Math.random() > 0.7 && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="w-full h-2 bg-green-200 dark:bg-green-700 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Week View Component
const WeekView = ({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) => {
  const weekDays = getWeekDays(selectedDate);
  const today = new Date();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-green-100 dark:border-green-800/30">
        <div className="p-4 bg-green-50 dark:bg-green-900/20"></div>
        {weekDays.map((day, index) => {
          const isToday =
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear();

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`p-4 text-center border-r border-green-100 dark:border-green-800/30 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${
                isToday
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-green-50 dark:bg-green-900/20"
              }`}
            >
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {dayNames[day.getDay()].slice(0, 3)}
              </div>
              <div
                className={`text-lg font-semibold mt-1 ${
                  isToday
                    ? "text-green-700 dark:text-green-300"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {day.getDate()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="max-h-96 overflow-y-auto">
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700"
          >
            <div className="p-2 text-right text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="h-12 border-r border-gray-100 dark:border-gray-700 relative hover:bg-green-50 dark:hover:bg-green-900/10"
              >
                {/* Sample events */}
                {Math.random() > 0.9 && (
                  <div className="absolute inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded text-white text-xs p-1 overflow-hidden">
                    Meeting
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Today Overview Component
const TodayOverview = () => {
  const today = new Date();
  const todayTasks = [
    {
      id: 1,
      title: "Review quarterly goals",
      completed: false,
      priority: "high",
    },
    {
      id: 2,
      title: "Team standup meeting",
      completed: true,
      priority: "medium",
    },
    {
      id: 3,
      title: "Finish project proposal",
      completed: false,
      priority: "high",
    },
    { id: 4, title: "Call with client", completed: false, priority: "low" },
    {
      id: 5,
      title: "Update documentation",
      completed: true,
      priority: "medium",
    },
  ];

  const todayEvents = [
    { id: 1, title: "Morning standup", time: "09:00", type: "meeting" },
    {
      id: 2,
      title: "Client presentation",
      time: "14:00",
      type: "presentation",
    },
    { id: 3, title: "Team retrospective", time: "16:30", type: "meeting" },
  ];

  return (
    <div className="space-y-6">
      {/* Today Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <p className="text-green-100">
          {todayTasks.filter((t) => !t.completed).length} tasks remaining •{" "}
          {todayEvents.length} events scheduled
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Today's Tasks
          </h3>
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      task.completed
                        ? "line-through text-gray-500 dark:text-gray-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      : task.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Scheduled Events
          </h3>
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                    {event.time}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {event.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Focus Session */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Focus Session
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              25:00
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Deep Work Time
            </div>
          </div>
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
            Start Focus
          </button>
        </div>
      </div>
    </div>
  );
};

// Right Panel Component
const RightPanel = ({
  content,
  onClose,
}: {
  content: string;
  onClose: () => void;
}) => {
  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-green-100 dark:border-green-800/30 flex flex-col">
      <div className="p-4 border-b border-green-100 dark:border-green-800/30 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {content}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 p-4">
        <p className="text-gray-600 dark:text-gray-300">
          {content} panel content will be displayed here. This could include
          detailed task management, calendar events, focus session controls, and
          more.
        </p>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function DashboardPage() {
  const [view, setView] = useState<"month" | "week" | "today">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [panelContent, setPanelContent] = useState<string | null>(null);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);

    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }

    setSelectedDate(newDate);
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 text-gray-800 dark:text-white">
      {/* Sidebar */}
      <Sidebar onSelect={(label) => setPanelContent(label)} />

      {/* Main + Right Panel */}
      <main className="flex-1 flex flex-row">
        {/* Central Column */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30 flex items-center justify-between">
            {/* Left: Month and Week */}
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h1>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Week {getWeekNumber(selectedDate)}
              </span>
            </div>

            {/* Right: Navigation and View Controls */}
            <div className="flex items-center gap-4">
              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate("prev")}
                  className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  Today
                </button>

                <button
                  onClick={() => navigateDate("next")}
                  className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* View Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg text-gray-700 dark:text-gray-200 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center space-x-2"
                >
                  <span>
                    {view === "month"
                      ? "Month"
                      : view === "week"
                      ? "Week"
                      : "Today"}
                  </span>
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700 shadow-xl z-50">
                    {["month", "week", "today"].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setView(v as "month" | "week" | "today");
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          view === v
                            ? "text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {v === "month"
                          ? "Month View"
                          : v === "week"
                          ? "Week View"
                          : "Today View"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Calendar Section */}
          <section className="flex-1 p-6 overflow-y-auto">
            {view === "month" && (
              <CalendarGrid
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
            {view === "week" && (
              <WeekView
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
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
