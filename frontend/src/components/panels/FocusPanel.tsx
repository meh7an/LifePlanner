"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Pause, Square, Clock, Target, Calendar } from "lucide-react";

type FocusSession = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  completed: boolean;
  taskId?: number; // Link to task if we needed later
};

export default function FocusPanel() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Start timer
  const handleStart = () => {
    if (!title.trim()) return;
    const start = new Date();
    const newSession: FocusSession = {
      id: Date.now(),
      title: title.trim(),
      startTime: start,
      endTime: null,
      durationMinutes: duration,
      completed: false,
    };
    setActiveSession(newSession);
    setRemainingSeconds(duration * 60);
    setIsPaused(false);
    setTitle("");
  };

  // Pause/Resume timer
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  // Stop + save session
  const handleStop = useCallback(() => {
    if (!activeSession) return;
    const now = new Date();
    const completedSession = {
      ...activeSession,
      endTime: now,
      completed: true,
    };
    setSessions((prev) => [completedSession, ...prev]);
    setActiveSession(null);
    setRemainingSeconds(0);
    setIsPaused(false);
  }, [activeSession]);

  // Countdown logic
  useEffect(() => {
    if (!activeSession || remainingSeconds <= 0 || isPaused) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, remainingSeconds, isPaused, handleStop]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const getProgress = () => {
    if (!activeSession) return 0;
    const totalSeconds = activeSession.durationMinutes * 60;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  };

  // Quick stats
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const todaySessions = sessions.filter(
    (s) => s.startTime.toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-4 overflow-y-auto max-h-[85vh] pr-2">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg text-center">
          <div className="text-base font-bold text-purple-600 dark:text-purple-400">
            {totalSessions}
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
            Sessions
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg text-center">
          <div className="text-base font-bold text-blue-600 dark:text-blue-400">
            {Math.round((totalMinutes / 60) * 10) / 10}h
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            Total
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-lg text-center">
          <div className="text-base font-bold text-green-600 dark:text-green-400">
            {todaySessions}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 font-medium">
            Today
          </div>
        </div>
      </div>

      {/* Active Session */}
      {activeSession ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 truncate">
              {activeSession.title}
            </h3>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activeSession.durationMinutes} minute session
            </div>
          </div>

          {/* Progress Circle/Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(getProgress())}% complete
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={handlePauseResume}
              className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
            >
              {isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleStop}
              className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {isPaused && (
            <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              Session Paused
            </div>
          )}
        </div>
      ) : (
        /* Start New Session */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Start Focus Session
            </h3>
          </div>

          <div>
            <label className="block text-xs mb-2 text-gray-600 dark:text-gray-400 font-medium">
              What are you working on?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Database design lab"
            />
          </div>

          <div>
            <label className="block text-xs mb-2 text-gray-600 dark:text-gray-400 font-medium">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={25}>25 minutes (Pomodoro)</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={!title.trim()}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 text-white transition font-medium flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Focus Session
          </button>
        </div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recent Sessions
            </h3>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                    {session.title}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.durationMinutes}m
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {session.startTime.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full bg-green-500"
                    title="Completed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
