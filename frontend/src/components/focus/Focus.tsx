// =============================================================================
// ⚡ LIFE PLANNER - COMPLETE FOCUS TIMER SYSTEM
// =============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FocusSession,
  StartFocusRequest,
  FocusStats,
  FocusTodaySummary,
} from "@/lib/types";
import { useFocusStore } from "@/lib/stores/focusStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { format, parseISO, differenceInMinutes } from "date-fns";

// =============================================================================
// 🎯 FOCUS UTILITIES
// =============================================================================

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

const formatMinutesToDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const getProductivityLevel = (
  minutes: number
): { level: string; color: string; icon: string } => {
  if (minutes >= 240)
    return { level: "Legendary", color: "text-purple-600", icon: "👑" };
  if (minutes >= 180)
    return { level: "Expert", color: "text-blue-600", icon: "🚀" };
  if (minutes >= 120)
    return { level: "Focused", color: "text-green-600", icon: "🎯" };
  if (minutes >= 60)
    return { level: "Getting Started", color: "text-yellow-600", icon: "⚡" };
  return { level: "Just Beginning", color: "text-gray-600", icon: "🌱" };
};

// =============================================================================
// ⏱️ CIRCULAR TIMER COMPONENT
// =============================================================================

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  isPaused: boolean;
  size?: number;
  strokeWidth?: number;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  timeRemaining,
  totalTime,
  isActive,
  isPaused,
  size = 200,
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - progress * circumference;

  const getTimerColor = () => {
    if (!isActive) return "#6B7280"; // gray
    if (isPaused) return "#F59E0B"; // yellow
    if (progress > 0.75) return "#10B981"; // green
    if (progress > 0.5) return "#3B82F6"; // blue
    if (progress > 0.25) return "#F59E0B"; // yellow
    return "#EF4444"; // red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg
        className="transform -rotate-90 w-full h-full"
        style={{ width: size, height: size }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getTimerColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Timer Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatTime(timeRemaining)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isActive ? (isPaused ? "Paused" : "Focusing") : "Ready"}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 🎯 TASK SELECTOR COMPONENT
// =============================================================================

interface TaskSelectorProps {
  selectedTaskId?: string;
  onTaskSelect: (taskId?: string) => void;
  className?: string;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({
  selectedTaskId,
  onTaskSelect,
  className = "",
}) => {
  const { tasks } = useTaskStore();
  const incompleteTasks = tasks.filter((task) => !task.completed);

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Focus on task (optional)
      </label>
      <select
        value={selectedTaskId || ""}
        onChange={(e) => onTaskSelect(e.target.value || undefined)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
      >
        <option value="">General focus session</option>
        {incompleteTasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.taskName}{" "}
            {task.priority === "high"
              ? "🔥"
              : task.priority === "medium"
              ? "⚡"
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
};

// =============================================================================
// ⚡ ACTIVE FOCUS SESSION COMPONENT
// =============================================================================

interface ActiveFocusSessionProps {
  session: FocusSession;
  onPause: () => void;
  onResume: () => void;
  onEnd: (completed: boolean) => void;
  className?: string;
}

const ActiveFocusSession: React.FC<ActiveFocusSessionProps> = ({
  session,
  onPause,
  onResume,
  onEnd,
  className = "",
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addNotification } = useUIStore();

  const defaultDuration = 25 * 60; // 25 minutes in seconds
  console.log("session", session);

  const startTime = parseISO(session.startTime);
  const elapsedMinutes =
    session.currentDuration || differenceInMinutes(new Date(), startTime);
  const elapsedSeconds = elapsedMinutes * 60;

  useEffect(() => {
    const remaining = Math.max(0, defaultDuration - elapsedSeconds);
    setTimeRemaining(remaining);

    if (!isPaused && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            addNotification({
              id: `focus-session-complete-${Date.now()}`,
              type: "focus_session_complete",
              title: "Focus Session Complete! 🎉",
              message: "Great job! You completed a full focus session.",
              read: false,
              createdAt: new Date().toISOString(),
              userId: "system", // or use the actual user ID if available
            });
            onEnd(true);
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
  }, [isPaused, elapsedSeconds, onEnd, addNotification, defaultDuration]);

  const handlePause = () => {
    setIsPaused(true);
    onPause();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume();
  };

  const handleEndSession = (completed: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onEnd(completed);
  };

  const progressPercentage =
    ((defaultDuration - timeRemaining) / defaultDuration) * 100;

  return (
    <div
      className={`${className} bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-100 dark:border-green-800/30`}
    >
      <div className="text-center">
        {/* Session Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Focus Session Active
          </h2>
          {session.task && (
            <div className="text-green-600 dark:text-green-400 font-medium">
              Working on: {session.task.taskName}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Started at {format(startTime, "h:mm a")}
          </div>
        </div>

        {/* Circular Timer */}
        <div className="flex justify-center mb-8">
          <CircularTimer
            timeRemaining={timeRemaining}
            totalTime={defaultDuration}
            isActive={!isPaused}
            isPaused={isPaused}
            size={240}
            strokeWidth={12}
          />
        </div>

        {/* Progress Info */}
        <div className="mb-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Progress: {Math.round(progressPercentage)}% complete
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isPaused ? (
            <button
              onClick={handleResume}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
                />
              </svg>
              <span>Resume Focus</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={() => handleEndSession(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Complete</span>
          </button>

          <button
            onClick={() => handleEndSession(false)}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
          >
            <svg
              className="w-6 h-6"
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
            <span>End Session</span>
          </button>
        </div>

        {/* Motivational Message */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {timeRemaining > 900
              ? "🎯 You're in the zone! Keep that focus strong."
              : timeRemaining > 300
              ? "💪 Almost there! Stay focused for the final stretch."
              : "🔥 Final minutes! You've got this!"}
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 🚀 FOCUS SESSION STARTER COMPONENT
// =============================================================================

interface FocusSessionStarterProps {
  onStart: (data: StartFocusRequest) => void;
  loading: boolean;
  className?: string;
}

const FocusSessionStarter: React.FC<FocusSessionStarterProps> = ({
  onStart,
  loading,
  className = "",
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [duration, setDuration] = useState(25);
  const { tasks } = useTaskStore();

  const durations = [
    { label: "15 minutes", value: 15, emoji: "⚡" },
    { label: "25 minutes", value: 25, emoji: "🎯" },
    { label: "45 minutes", value: 45, emoji: "💪" },
    { label: "60 minutes", value: 60, emoji: "🚀" },
  ];

  const handleStart = () => {
    onStart({ taskId: selectedTaskId });
  };

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  return (
    <div
      className={`${className} bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800/30 p-8`}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
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
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Start Focus Session
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Time to dive deep and get things done! 🎯
        </p>
      </div>

      {/* Duration Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Choose your focus duration
        </label>
        <div className="grid grid-cols-2 gap-3">
          {durations.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                duration === d.value
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{d.emoji}</span>
                <span className="font-medium">{d.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Task Selection */}
      <TaskSelector
        selectedTaskId={selectedTaskId}
        onTaskSelect={setSelectedTaskId}
        className="mb-6"
      />

      {/* Session Preview */}
      {(selectedTask || duration !== 25) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Session Preview:
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div>⏱️ Duration: {duration} minutes</div>
            {selectedTask && <div>🎯 Task: {selectedTask.taskName}</div>}
            {!selectedTask && <div>💡 General focus session</div>}
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Starting...</span>
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
              />
            </svg>
            <span>Start Focus Session</span>
          </>
        )}
      </button>

      {/* Tips */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: Turn off notifications and find a quiet space for the best
          focus experience
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// 📊 FOCUS STATS COMPONENT
// =============================================================================

interface FocusStatsProps {
  stats: FocusStats;
  todaySummary: FocusTodaySummary;
  className?: string;
}

const FocusStatsComponent: React.FC<FocusStatsProps> = ({
  stats,
  todaySummary,
  className = "",
}) => {
  const productivity = getProductivityLevel(todaySummary.totalMinutes);

  const statCards = [
    {
      title: "Today's Focus",
      value: formatMinutesToDuration(todaySummary.totalMinutes),
      subtitle: `${todaySummary.totalSessions} sessions`,
      icon: "⚡",
      color: "bg-blue-500",
    },
    {
      title: "This Week",
      value: formatMinutesToDuration(stats.weekMinutes),
      subtitle: `${stats.weekSessions} sessions`,
      icon: "📊",
      color: "bg-green-500",
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak} days`,
      subtitle: `Best: ${stats.longestStreak} days`,
      icon: "🔥",
      color: "bg-orange-500",
    },
    {
      title: "Total Focus",
      value: `${Math.round(stats.totalHours)}h`,
      subtitle: `${stats.totalSessions} sessions`,
      icon: "🎯",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className={`${className} space-y-6`}>
      {/* Productivity Level */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">{productivity.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Today&apos;s Productivity Level
          </h3>
          <div className={`text-2xl font-bold ${productivity.color} mb-2`}>
            {productivity.level}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {todaySummary.totalMinutes > 0
              ? `You've focused for ${formatMinutesToDuration(
                  todaySummary.totalMinutes
                )} today!`
              : "Ready to start your first focus session?"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-xl`}
              >
                {stat.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.subtitle}
                </div>
              </div>
            </div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              {stat.title}
            </h4>
          </div>
        ))}
      </div>

      {/* Session History */}
      {todaySummary.sessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
            Today&apos;s Sessions
          </h3>
          <div className="space-y-3">
            {todaySummary.sessions.slice(-5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      session.completed ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {session.task?.taskName || "General Focus"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(session.startTime), "h:mm a")} -{" "}
                      {session.endTime
                        ? format(parseISO(session.endTime), "h:mm a")
                        : "Ongoing"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatMinutesToDuration(session.durationMinutes)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {session.completed ? "Completed" : "Incomplete"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Focus Completion Rate
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                Completion Rate
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(stats.completionRate)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{stats.completedSessions} completed</span>
              <span>{stats.totalSessions} total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 🎯 MAIN FOCUS INTERFACE COMPONENT
// =============================================================================

interface FocusInterfaceProps {
  className?: string;
}

const FocusInterface: React.FC<FocusInterfaceProps> = ({ className = "" }) => {
  const {
    activeSession,
    stats,
    todaySummary,
    startLoading,
    loading,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    fetchActiveSession,
    fetchStats,
    fetchTodaySummary,
  } = useFocusStore();

  const { fetchTasks } = useTaskStore();

  const { addNotification } = useUIStore();

  useEffect(() => {
    fetchActiveSession();
    fetchStats();
    fetchTodaySummary();
    fetchTasks();
  }, [fetchActiveSession, fetchStats, fetchTodaySummary, fetchTasks]);

  const handleStartSession = async (data: StartFocusRequest) => {
    const success = await startSession(data);
    if (success) {
      addNotification({
        id: `system-announcement-${Date.now()}`,
        type: "system_announcement",
        title: "Focus Session Started! 🎯",
        message: "Time to get in the zone and focus!",
        read: false,
        createdAt: new Date().toISOString(),
        userId: "system", // or use actual user ID if available
      });
    }
  };

  const handleEndSession = async (completed: boolean) => {
    if (!activeSession) return;

    const success = await endSession(completed);
    if (success) {
      addNotification({
        id: `focus-session-${Date.now()}`,
        type: completed ? "focus_session_complete" : "system_announcement",
        title: completed ? "Session Complete! 🎉" : "Session Ended",
        message: completed
          ? "Great work! You completed your focus session."
          : "Session ended. Every bit of focus counts!",
        read: false,
        createdAt: new Date().toISOString(),
        userId: "system", // or use actual user ID if available
      });
    }
  };

  const handlePauseSession = () => {
    pauseSession();
    addNotification({
      id: `system-announcement-${Date.now()}`,
      type: "system_announcement",
      title: "Session Paused",
      message: "Take a quick break if you need it!",
      read: false,
      createdAt: new Date().toISOString(),
      userId: "system", // or use actual user ID if available
    });
  };

  const handleResumeSession = () => {
    resumeSession();
    addNotification({
      id: `system-announcement-${Date.now()}`,
      type: "system_announcement",
      title: "Back to Focus! 💪",
      message: "Welcome back! Let's keep that momentum going.",
      read: false,
      createdAt: new Date().toISOString(),
      userId: "system", // or use actual user ID if available
    });
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse space-y-6`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-8">
          <div className="text-center space-y-6">
            <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-8`}>
      {/* Active Session or Starter */}
      {activeSession ? (
        <ActiveFocusSession
          session={activeSession}
          onPause={handlePauseSession}
          onResume={handleResumeSession}
          onEnd={handleEndSession}
        />
      ) : (
        <FocusSessionStarter
          onStart={handleStartSession}
          loading={startLoading}
        />
      )}

      {/* Focus Stats */}
      {stats && todaySummary && (
        <FocusStatsComponent stats={stats} todaySummary={todaySummary} />
      )}

      {/* Quick Actions */}
      {!activeSession && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
            Quick Focus
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleStartSession({})}
              disabled={startLoading}
              className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium">Quick 25min</div>
              <div className="text-xs opacity-90">Standard focus</div>
            </button>

            <button
              onClick={() => handleStartSession({})}
              disabled={startLoading}
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="text-2xl mb-2">💪</div>
              <div className="font-medium">Deep Work</div>
              <div className="text-xs opacity-90">45 minutes</div>
            </button>

            <button
              onClick={() => handleStartSession({})}
              disabled={startLoading}
              className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-medium">Power Hour</div>
              <div className="text-xs opacity-90">60 minutes</div>
            </button>
          </div>
        </div>
      )}

      {/* Focus Tips */}
      {!activeSession && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Focus Tips for Maximum Productivity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">🔕</span>
              <span>Turn off notifications and distractions</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">🎧</span>
              <span>Use focus music or white noise</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">💧</span>
              <span>Keep water nearby to stay hydrated</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">📝</span>
              <span>Have a clear goal for your session</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">🌡️</span>
              <span>Maintain a comfortable room temperature</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">⏸️</span>
              <span>Take short breaks between sessions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 📱 MINI FOCUS WIDGET (for dashboard)
// =============================================================================

interface MiniFocusWidgetProps {
  className?: string;
  onStartFocus?: () => void;
}

const MiniFocusWidget: React.FC<MiniFocusWidgetProps> = ({
  className = "",
  onStartFocus,
}) => {
  const { activeSession, todaySummary, loading } = useFocusStore();

  if (loading) {
    return (
      <div
        className={`${className} bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6 animate-pulse`}
      >
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`${className} bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6`}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
        Focus
      </h3>

      {activeSession ? (
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            Session Active
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {activeSession.task?.taskName || "General focus"}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full w-1/3"></div>
          </div>
          <button
            onClick={onStartFocus}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
          >
            View Session →
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatMinutesToDuration(todaySummary?.totalMinutes || 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {todaySummary?.totalSessions || 0} sessions today
          </div>
          <button
            onClick={onStartFocus}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Start Focus
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 🚀 EXPORT ALL COMPONENTS
// =============================================================================

export {
  FocusInterface as Focus,
  ActiveFocusSession,
  FocusSessionStarter,
  FocusStatsComponent as FocusStats,
  CircularTimer,
  TaskSelector,
  MiniFocusWidget,
};

export default FocusInterface;
