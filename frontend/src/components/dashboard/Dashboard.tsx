// =============================================================================
// 🏠 COMPLETE DASHBOARD COMPONENT WITH WORKING MODALS - UPDATED LAYOUT
// =============================================================================

"use client";

import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useFocusStore } from "@/lib/stores/focusStore";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useAuth } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { format, isToday, isThisWeek, parseISO } from "date-fns";
import type { Task, Board, CalendarEvent } from "@/lib/types";

// Import modal components - Update these paths to match your project structure
import TaskComponents from "../tasks/Task";
import { BoardModal } from "../board/Board";
import { EventModal } from "../calendar/Calendar";
import { useRouter } from "next/navigation";

const { TaskModal } = TaskComponents;

// =============================================================================
// 📊 STATS CARDS COMPONENT
// =============================================================================

const StatsCards: React.FC = () => {
  const { stats } = useDashboardStore();

  const statsData = [
    {
      title: "Tasks Completed",
      value: stats?.tasks.completed || 0,
      total: stats?.tasks.total || 0,
      icon: CheckSquare,
      color: "green",
      trend: stats?.tasks.completed
        ? `${Math.round((stats.tasks.completed / stats?.tasks.total) * 100)}%`
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
      value: stats?.productivity || 0,
      unit: "/100",
      icon: TrendingUp,
      color: "orange",
      trend:
        stats?.productivity?.trend === "up"
          ? "↗️ Rising"
          : stats?.productivity?.trend === "down"
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
                  {typeof stat.value === "number"
                    ? stat.value
                    : stat.value.score}
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
// 🎯 UPDATED QUICK ACTIONS COMPONENT - Now responsive 4-column to 2-column
// =============================================================================

interface QuickActionsProps {
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onOpenBoardModal: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenTaskModal,
  onOpenEventModal,
  onOpenBoardModal,
}) => {
  const { startSession, startLoading } = useFocusStore();
  const { fetchStats } = useDashboardStore();

  const handleStartFocusSession = async () => {
    const success = await startSession({ durationMinutes: 25 });
    if (success) {
      await fetchStats();
    }
  };

  const actions = [
    {
      title: "New Task",
      description: "Add a task to your list",
      icon: Plus,
      color: "green",
      action: onOpenTaskModal,
    },
    {
      title: startLoading ? "Starting..." : "Start Focus",
      description: "Begin a focus session",
      icon: Zap,
      color: "orange",
      action: handleStartFocusSession,
      disabled: startLoading,
    },
    {
      title: "Add Event",
      description: "Schedule a calendar event",
      icon: Calendar,
      color: "blue",
      action: onOpenEventModal,
    },
    {
      title: "New Board",
      description: "Create a project board",
      icon: BarChart3,
      color: "purple",
      action: onOpenBoardModal,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h2>

      {/* Updated grid: 4 columns on large screens, 2 columns on smaller screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              disabled={action.disabled}
              className={`p-4 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-md ${
                action.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : action.color === "green"
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
// 📋 UPDATED TODAY'S TASKS COMPONENT - Fixed stats refresh
// =============================================================================

interface TodaysTasksProps {
  onOpenTaskModal: () => void;
}

const TodaysTasks: React.FC<TodaysTasksProps> = ({ onOpenTaskModal }) => {
  const { todayTasks, toggleTaskComplete, fetchTodayTasks } = useTaskStore();
  // 🔥 ADD THIS - Import fetchStats to refresh dashboard stats
  const { fetchStats } = useDashboardStore();

  const dueTasks = todayTasks?.dueTasks || [];
  const newTasks = todayTasks?.newTasks || [];
  const overdueTasks = todayTasks?.overdueTasks || [];
  const completedTodayCount = todayTasks?.completedToday || 0;
  const totalTasks = todayTasks?.summary?.totalDue || 0;

  // Combine due tasks and new tasks for display
  const allTasks = [...overdueTasks, ...dueTasks, ...newTasks];

  // 🔥 UPDATED - Handle task completion toggle with dashboard stats refresh
  const handleToggleComplete = async (taskId: string) => {
    const success = await toggleTaskComplete(taskId);
    if (success) {
      // Refresh today's tasks to update the UI
      await fetchTodayTasks();
      // 🔥 ADD THIS LINE - Refresh dashboard stats to update the completed count
      await fetchStats();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <CheckSquare className="w-5 h-5 text-green-500 mr-2" />
          Today&apos;s Tasks
        </h2>
        <button
          onClick={onOpenTaskModal}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {allTasks.length === 0 ? (
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
              onClick={onOpenTaskModal}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Task
            </button>
          </div>
        ) : (
          <>
            {allTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <button
                  onClick={() => handleToggleComplete(task.id)}
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
                  <div className="flex items-center space-x-2">
                    <p
                      className={`text-sm font-medium ${
                        task.completed
                          ? "line-through text-gray-500 dark:text-gray-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {task.taskName}
                    </p>
                    {task.newTask && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  {task.dueTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {format(parseISO(task.dueTime), "h:mm a")}
                    </p>
                  )}
                  {task.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {task.description}
                    </p>
                  )}
                  {task.dueTime &&
                    new Date(task.dueTime).getTime() <
                      new Date().setHours(0, 0, 0, 0) &&
                    !task.completed && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium rounded-full">
                        Overdue
                      </span>
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

            {allTasks.length > 5 && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center">
                  View {allTasks.length - 5} more tasks
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Completed Tasks Summary */}
      {totalTasks > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Completed today
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {completedTodayCount}/{totalTasks} task
              {completedTodayCount > 1 ? "s" : ""} ✨
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

interface UpcomingEventsProps {
  onOpenEventModal: () => void;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  onOpenEventModal,
}) => {
  const { events } = useCalendarStore();

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
          onClick={onOpenEventModal}
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
              onClick={onOpenEventModal}
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
                key={event.id}
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
// 📈 QUICK INSIGHTS COMPONENT
// =============================================================================

const QuickInsights: React.FC = () => {
  const { insights } = useDashboardStore();

  const insightData = [
    {
      title: "Most Productive Hour",
      value: insights?.patterns.bestFocusHour
        ? `${insights.patterns.bestFocusHour}:00`
        : "N/A",
      icon: Clock,
      color: "blue",
    },
    {
      title: "Focus Minutes/Hour",
      value: Math.round(insights?.patterns.averageFocusMinutesPerHour || 0),
      icon: Target,
      color: "green",
    },
    {
      title: "Session Average",
      value: `${Math.round(insights?.summary.averageSessionLength || 0)}min`,
      icon: Zap,
      color: "orange",
    },
    {
      title: "Completion Rate",
      value: `${insights?.summary.completionRate || 0}%`,
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

      {/* Enhanced Recommendations with more context */}
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
// ⚡ ACTIVE FOCUS SESSION COMPONENT FOR DASHBOARD
// =============================================================================

const ActiveFocusSession: React.FC = () => {
  const { activeSession, endSession, pauseSession, resumeSession } =
    useFocusStore();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const sessionDurationMinutes = activeSession?.durationMinutes || 25;
  const totalDurationSeconds = sessionDurationMinutes * 60;

  useEffect(() => {
    if (!activeSession) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const startTime = parseISO(activeSession.startTime);
    const now = new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - startTime.getTime()) / 1000
    );
    const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);

    setTimeRemaining(remaining);
    if (!isPaused && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            endSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSession, isPaused, totalDurationSeconds, endSession]);

  const handlePause = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pauseSession();
  };

  const handleResume = () => {
    setIsPaused(false);
    // Timer will restart in the next useEffect cycle
    resumeSession();
  };

  const handleEndSession = (completed: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    endSession(completed);
  };

  const handleViewFullSession = () => {
    router.push("/dashboard/focus");
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercentage =
    totalDurationSeconds > 0
      ? ((totalDurationSeconds - timeRemaining) / totalDurationSeconds) * 100
      : 0;

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
          <button
            onClick={handleViewFullSession}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors"
          >
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
            {formatTime(timeRemaining)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {activeSession.task?.taskName || "General Focus Session"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {sessionDurationMinutes} minute session •{" "}
            {Math.round(progressPercentage)}% complete
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
                2 * Math.PI * 40 * (1 - progressPercentage / 100)
              }`}
              className={`transition-all duration-1000 ${
                isPaused ? "text-yellow-500" : "text-orange-500"
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap
              className={`w-8 h-8 ${
                isPaused ? "text-yellow-500" : "text-orange-500"
              }`}
            />
          </div>
        </div>

        {/* Status indicator */}
        <div className="mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPaused
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            }`}
          >
            {isPaused ? "⏸️ Paused" : "🎯 Focusing"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={isPaused ? handleResume : handlePause}
            className={`px-3 py-2 text-white rounded-lg transition-colors text-sm ${
              isPaused
                ? "bg-green-500 hover:bg-green-600"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => handleEndSession(true)}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
          >
            Complete
          </button>
          <button
            onClick={() => handleEndSession(false)}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
          >
            End
          </button>
        </div>

        {/* View Full Session Button */}
        <button
          onClick={handleViewFullSession}
          className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
        >
          View Full Session →
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// 🏠 MAIN DASHBOARD COMPONENT - UPDATED LAYOUT WITH QUICK ACTIONS FIRST
// =============================================================================

const Dashboard: React.FC = () => {
  const { fetchStats, fetchOverview, fetchInsights } = useDashboardStore();
  const { fetchTodayTasks } = useTaskStore();
  const { fetchActiveSession, fetchTodaySummary } = useFocusStore();
  const { fetchEvents, fetchCalendars, calendars } = useCalendarStore();
  const { fetchBoards } = useBoardStore();
  const { user } = useAuth();
  const { modals, openModal, closeModal } = useUIStore();

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal states for dashboard
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

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
        fetchCalendars(),
        fetchBoards(),
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
    fetchCalendars,
    fetchBoards,
  ]);

  // Modal handlers
  const handleOpenTaskModal = () => {
    setSelectedTask(null);
    openModal("taskModal");
  };

  const handleOpenBoardModal = () => {
    setSelectedBoard(null);
    openModal("boardModal");
  };

  const handleOpenEventModal = () => {
    setSelectedEvent(null);
    openModal("eventModal");
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    closeModal("taskModal");
    // Refresh data after task creation/edit
    fetchTodayTasks();
    fetchStats();
  };

  const handleCloseBoardModal = () => {
    setSelectedBoard(null);
    closeModal("boardModal");
    // Refresh data after board creation/edit
    fetchBoards();
    fetchStats();
  };

  const handleCloseEventModal = () => {
    setSelectedEvent(null);
    closeModal("eventModal");
    // Refresh data after event creation/edit
    fetchEvents();
  };

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

        {/* NEW LAYOUT: Quick Actions as full-width row */}

        {/* Main Grid - Now without Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Tasks and Events */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActions
              onOpenTaskModal={handleOpenTaskModal}
              onOpenEventModal={handleOpenEventModal}
              onOpenBoardModal={handleOpenBoardModal}
            />
            <TodaysTasks onOpenTaskModal={handleOpenTaskModal} />
            <UpcomingEvents onOpenEventModal={handleOpenEventModal} />
          </div>

          {/* Right Column - Focus and Insights */}
          <div className="space-y-6">
            <ActiveFocusSession />
            <QuickInsights />
          </div>
        </div>

        {/* Modal Components */}
        <TaskModal
          isOpen={modals.taskModal}
          onClose={handleCloseTaskModal}
          task={selectedTask}
        />

        <BoardModal
          isOpen={modals.boardModal}
          onClose={handleCloseBoardModal}
          board={selectedBoard}
        />

        <EventModal
          isOpen={modals.eventModal}
          onClose={handleCloseEventModal}
          event={selectedEvent}
          selectedDate={new Date()}
          calendarId={calendars[0]?.id || "default"}
        />
      </div>
    </div>
  );
};

// =============================================================================
// 🚀 EXPORTS
// =============================================================================

export default Dashboard;
export { Dashboard };
