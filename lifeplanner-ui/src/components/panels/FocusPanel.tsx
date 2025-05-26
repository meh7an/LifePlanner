"use client";

import { useEffect, useState } from "react";

type FocusSession = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  completed: boolean;
};

export default function FocusPanel() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);

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
    setTitle("");
  };

  // Stop + save session
  const handleStop = () => {
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
  };

  // Countdown logic
  useEffect(() => {
    if (!activeSession || remainingSeconds <= 0) return;

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
  }, [activeSession, remainingSeconds]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2 text-sm">
      {/* Start new focus session */}
      {!activeSession && (
        <div className="space-y-4">
          <h3 className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 tracking-wide uppercase">
            Start a Focus Session
          </h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-600 bg-[#1f1f1f] text-sm text-gray-100 placeholder:text-gray-500 focus:ring-1 focus:ring-[#999]"
          />

          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 mt-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-[#f9f7f4] dark:bg-[#1c1c1c] text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c3baba]"
          >
            <option value={25}>25 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>

          <button
            onClick={handleStart}
            className="w-full px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-white transition"
          >
            Start Focus
          </button>
        </div>
      )}

      {/* Active session */}
      {activeSession && (
        <div className="mt-6 p-6 rounded-md bg-[#1e1e1e] text-center">
          <div className="text-sm font-medium text-gray-400 mb-2">
            {activeSession.title}
          </div>
          <div className="text-5xl font-semibold mb-4">
            {formatTime(remainingSeconds)}
          </div>
          <button
            onClick={handleStop}
            className="w-full px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-white transition"
          >
            End Session
          </button>
        </div>
      )}

      {/* Past sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Past Sessions
          </h3>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="p-3 rounded-md bg-[#1f1f1f] text-gray-200 border border-gray-600 mb-2"
              >
                <div className="text-[13px] font-medium tracking-tight text-gray-700 dark:text-gray-200">
                  {s.title}
                </div>
                <div className="text-[11px] mt-1 text-gray-400 dark:text-gray-500">
                  {s.durationMinutes} min ·{" "}
                  {new Date(s.startTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
