"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Plus,
  ArrowRight,
  BarChart3,
  Activity,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useFocusStore } from "@/lib/stores/focusStore";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useAuth } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { format, isToday, isThisWeek, parseISO } from "date-fns";
import Image from "next/image";

// =============================================================================
// 📊 STATS CARDS COMPONENT
// =============================================================================

const StatsCards: React.FC = () => {
  const { stats } = useDashboardStore();

  const statsData = [
    {
      title: "Tasks Completed",
      value: stats?.tasks.completedToday || 0,
      total: stats?.tasks.total || 0,
      icon: CheckSquare,
      color: "green",
      trend: stats?.tasks.completionRate
        ? `${Math.round(stats.tasks.completionRate)}%`
        : "0%",
      bgGradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Focus Time",
      value: stats?.focus.todayMinutes || 0,
      unit: "min",
      icon: Zap,
      color: "blue",
      trend: stats?.focus.currentStreak
        ? `${stats.focus.currentStreak} day streak`
        : "No streak",
      bgGradient: "from-blue-500 to-cyan-600",
    },
    {
      title: "Active Boards",
      value: stats?.boards.active || 0,
      total: stats?.boards.total || 0,
      icon: BarChart3,
      color: "purple",
      trend: `${Math.round(stats?.boards.averageTasksPerBoard || 0)} avg tasks`,
      bgGradient: "from-purple-500 to-pink-600",
    },
    {
      title: "Productivity Score",
      value: stats?.productivity.score || 0,
      unit: "/100",
      icon: TrendingUp,
      color: "orange",
      trend:
        stats?.productivity.trend === "up"
          ? "↗️ Rising"
          : stats?.productivity.trend === "down"
          ? "↘️ Falling"
          : "➡️ Stable",
      bgGradient: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg bg-gradient-to-r ${stat.bgGradient}`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                  {stat.unit && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      {stat.unit}
                    </span>
                  )}
                  {stat.total && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /{stat.total}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.trend}
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {stat.title}
            </h3>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// 📋 TODAY'S TASKS COMPONENT
// =============================================================================

const TodaysTasks: React.FC = () => {
  const { todayTasks, toggleTaskComplete } = useTaskStore();
  const { openModal } = useUIStore();

  const dueTasks = todayTasks?.dueTasks || [];
  const completedToday = todayTasks?.completedToday || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <CheckSquare className="w-5 h-5 text-green-500 mr-2" />
          Today&apos;s Tasks
        </h2>
        <button
          onClick={() => openModal("taskModal")}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {dueTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All caught up! 🎉
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You have no tasks due today. Great job!
            </p>
            <button
              onClick={() => openModal("taskModal")}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Task
            </button>
          </div>
        ) : (
          <>
            {dueTasks.slice(0, 5).map((task) => (
              <div
                key={task.taskID}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <button
                  onClick={() => toggleTaskComplete(task.taskID)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                  }`}
                >
                  {task.completed && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.completed
                        ? "line-through text-gray-500 dark:text-gray-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {task.taskName}
                  </p>
                  {task.dueTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {format(parseISO(task.dueTime), "h:mm a")}
                    </p>
                  )}
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

            {dueTasks.length > 5 && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center">
                  View {dueTasks.length - 5} more tasks
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Completed Tasks Summary */}
      {completedToday.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Completed today
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {completedToday.length} tasks ✨
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 📅 UPCOMING EVENTS COMPONENT
// =============================================================================

const UpcomingEvents: React.FC = () => {
  const { events } = useCalendarStore();
  const { openModal } = useUIStore();

  // Filter upcoming events (next 7 days)
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.startTime);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= weekFromNow;
    })
    .sort(
      (a, b) =>
        parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 text-green-500 mr-2" />
          Upcoming Events
        </h2>
        <button
          onClick={() => openModal("eventModal")}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No upcoming events
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your calendar is clear for the next week.
            </p>
            <button
              onClick={() => openModal("eventModal")}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </button>
          </div>
        ) : (
          upcomingEvents.map((event) => {
            const startTime = parseISO(event.startTime);
            const endTime = parseISO(event.endTime);
            const isEventToday = isToday(startTime);
            const isEventThisWeek = isThisWeek(startTime);

            return (
              <div
                key={event.eventID}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    event.eventType === "meeting"
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : event.eventType === "personal"
                      ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      : "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {event.task?.taskName || `${event.eventType} Event`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isEventToday
                      ? `Today, ${format(startTime, "h:mm a")} - ${format(
                          endTime,
                          "h:mm a"
                        )}`
                      : `${format(startTime, "MMM d, h:mm a")} - ${format(
                          endTime,
                          "h:mm a"
                        )}`}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    isEventToday
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : isEventThisWeek
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {event.eventType}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// =============================================================================
// ⚡ ACTIVE FOCUS SESSION COMPONENT
// =============================================================================

const ActiveFocusSession: React.FC = () => {
  const {
    activeSession,
    currentDuration,
    isRunning,
    endSession,
    pauseSession,
    resumeSession,
  } = useFocusStore();
  const [displayTime, setDisplayTime] = useState("00:00");

  useEffect(() => {
    const minutes = Math.floor(currentDuration / 60);
    const seconds = currentDuration % 60;
    setDisplayTime(
      `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    );
  }, [currentDuration]);

  if (!activeSession) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No active focus session
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start a focus session to boost your productivity.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors">
            <Zap className="w-4 h-4 mr-2" />
            Start Focus Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center justify-center">
          <Zap className="w-5 h-5 text-orange-500 mr-2" />
          Focus Session Active
        </h2>

        {/* Timer Display */}
        <div className="mb-6">
          <div className="text-4xl font-bold text-orange-500 mb-2">
            {displayTime}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {activeSession.task?.taskName || "General Focus Session"}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${
                2 * Math.PI * 40 * (1 - (currentDuration % 1500) / 1500)
              }`}
              className="text-orange-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={isRunning ? pauseSession : resumeSession}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {isRunning ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => endSession(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Complete
          </button>
          <button
            onClick={() => endSession(false)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 📈 QUICK INSIGHTS COMPONENT
// =============================================================================

const QuickInsights: React.FC = () => {
  const { insights } = useDashboardStore();

  const insightData = [
    {
      title: "Most Productive Hour",
      value: insights?.patterns.mostProductiveHours?.[0]
        ? `${insights.patterns.mostProductiveHours[0]}:00`
        : "N/A",
      icon: Clock,
      color: "blue",
    },
    {
      title: "Daily Task Average",
      value: Math.round(insights?.patterns.averageTasksPerDay || 0),
      icon: Target,
      color: "green",
    },
    {
      title: "Focus Time Today",
      value: `${Math.round(insights?.patterns.averageFocusTimePerDay || 0)}min`,
      icon: Zap,
      color: "orange",
    },
    {
      title: "Weekly Streak",
      value: insights?.trends.tasksCompleted?.length || 0,
      icon: Activity,
      color: "purple",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
        Quick Insights
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {insightData.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${
                  insight.color === "blue"
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : insight.color === "green"
                    ? "bg-green-100 dark:bg-green-900/20"
                    : insight.color === "orange"
                    ? "bg-orange-100 dark:bg-orange-900/20"
                    : "bg-purple-100 dark:bg-purple-900/20"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    insight.color === "blue"
                      ? "text-blue-600 dark:text-blue-400"
                      : insight.color === "green"
                      ? "text-green-600 dark:text-green-400"
                      : insight.color === "orange"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-purple-600 dark:text-purple-400"
                  }`}
                />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {insight.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {insight.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            💡 Recommendations
          </h3>
          <ul className="space-y-2">
            {insights.recommendations.slice(0, 2).map((rec, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
              >
                <span className="text-green-500 mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 🎯 QUICK ACTIONS COMPONENT
// =============================================================================

const QuickActions: React.FC = () => {
  const { openModal } = useUIStore();
  const { startSession } = useFocusStore();

  const actions = [
    {
      title: "New Task",
      description: "Add a task to your list",
      icon: Plus,
      color: "green",
      action: () => openModal("taskModal"),
    },
    {
      title: "Start Focus",
      description: "Begin a focus session",
      icon: Zap,
      color: "orange",
      action: () => startSession(),
    },
    {
      title: "Add Event",
      description: "Schedule a calendar event",
      icon: Calendar,
      color: "blue",
      action: () => openModal("eventModal"),
    },
    {
      title: "New Board",
      description: "Create a project board",
      icon: BarChart3,
      color: "purple",
      action: () => openModal("boardModal"),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`p-4 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-md ${
                action.color === "green"
                  ? "border-green-300 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                  : action.color === "orange"
                  ? "border-orange-300 dark:border-orange-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  : action.color === "blue"
                  ? "border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "border-purple-300 dark:border-purple-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              }`}
            >
              <Icon
                className={`w-6 h-6 mx-auto mb-2 ${
                  action.color === "green"
                    ? "text-green-600 dark:text-green-400"
                    : action.color === "orange"
                    ? "text-orange-600 dark:text-orange-400"
                    : action.color === "blue"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-purple-600 dark:text-purple-400"
                }`}
              />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {action.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {action.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// 🏠 MAIN DASHBOARD COMPONENT
// =============================================================================

const Dashboard: React.FC = () => {
  const { fetchStats, fetchOverview, fetchInsights } = useDashboardStore();
  const { fetchTodayTasks } = useTaskStore();
  const { fetchActiveSession, fetchTodaySummary } = useFocusStore();
  const { fetchEvents } = useCalendarStore();
  const { user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      await Promise.all([
        fetchStats(),
        fetchOverview(),
        fetchInsights(),
        fetchTodayTasks(),
        fetchActiveSession(),
        fetchTodaySummary(),
        fetchEvents(),
      ]);
    };

    fetchDashboardData();
  }, [
    fetchStats,
    fetchOverview,
    fetchInsights,
    fetchTodayTasks,
    fetchActiveSession,
    fetchTodaySummary,
    fetchEvents,
  ]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 min-h-screen p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {user?.username}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Here&apos;s what&apos;s happening with your productivity today.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Tasks and Events */}
          <div className="lg:col-span-2 space-y-6">
            <TodaysTasks />
            <UpcomingEvents />
          </div>

          {/* Right Column - Focus and Insights */}
          <div className="space-y-6">
            <ActiveFocusSession />
            <QuickInsights />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 📱 DASHBOARD LAYOUT COMPONENT
// =============================================================================

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const getUserInitials = () => {
    if (!user) return "";
    const names = user.username.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const sidebarItems = [
    { icon: "🏠", label: "Dashboard", href: "/dashboard" },
    { icon: "📋", label: "Tasks", href: "/dashboard/tasks", badge: "12" },
    { icon: "📅", label: "Calendar", href: "/dashboard/calendar" },
    { icon: "⚡", label: "Focus", href: "/dashboard/focus", badge: "2h" },
    { icon: "📊", label: "Boards", href: "/dashboard/boards", badge: "3" },
    { icon: "📈", label: "Analytics", href: "/dashboard/analytics" },
    { icon: "🗂️", label: "Archives", href: "/dashboard/archives" },
    { icon: "👥", label: "Shared", href: "/dashboard/shared" },
  ];

  return (
    <div
      className={`h-screen flex transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-white dark:bg-gray-800 border-r border-green-100 dark:border-green-800/30 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-green-100 dark:border-green-800/30">
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
            {sidebarOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Life Planner
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="w-full flex items-center justify-between px-3 py-3 text-left rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && (
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 font-medium">
                    {item.label}
                  </span>
                )}
              </div>
              {sidebarOpen && item.badge && (
                <span className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-green-100 dark:border-green-800/30 relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <div className="relative">
              {user?.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-200 dark:border-green-700"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.username}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Premium Plan
                </div>
              </div>
            )}
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && sidebarOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-100 dark:border-green-800/30 py-2">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center space-x-3 transition-colors">
                <User className="w-4 h-4" />
                <span>Profile Settings</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center space-x-3 transition-colors">
                <Settings className="w-4 h-4" />
                <span>Preferences</span>
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors relative">
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
                    d="M15 17h5l-5 5v-5zM19.95 10.36c.03-.16.05-.33.05-.5a8 8 0 10-16 0c0 4.42 3.58 8 8 8 .17 0 .34-.02.5-.05"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Search */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
};

// =============================================================================
// 🚀 EXPORTS
// =============================================================================

export default Dashboard;
export { Dashboard, DashboardLayout };
