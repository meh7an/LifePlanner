"use client";

import { useState, useEffect } from "react";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function TodayOverview() {
  const [now, setNow] = useState(new Date());

  // Update time every minute for accuracy
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const redLinePosition = currentHour * 48 + (currentMinute / 60) * 48; // 48px per hour

  return (
    <div className="relative w-full h-[1152px] overflow-y-scroll border rounded-md bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 border-b border-gray-300 dark:border-gray-600">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-semibold">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
            })}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {now.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}{" "}
            · Week {getWeekNumber(now)}
          </div>
        </div>
      </div>

      {/* Hour Grid */}
      <div className="relative grid grid-rows-24">
        {hours.map((hour, index) => (
          <div
            key={index}
            className="h-12 px-4 flex items-start text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
          >
            <span className="w-12">{hour}</span>
            <div className="flex-1 border-l border-gray-300 dark:border-gray-700 h-full" />
          </div>
        ))}

        {/* Red Line Now Indicator */}
        <div
          className="absolute left-12 right-4 h-[1px] bg-red-500"
          style={{ top: `${redLinePosition}px` }}
        >
          <div className="absolute -top-2 -left-12 text-xs text-red-500">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}
