"use client";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export default function TodayOverview() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const position = currentHour * 48 + (currentMinute / 60) * 48; // 48px per hour

  return (
    <div className="relative w-full h-[1152px] overflow-y-scroll border rounded-md bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-lg font-semibold">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h2>
      </div>

      {/* Hourly Grid */}
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

        {/* Current time indicator */}
        <div
          className="absolute left-12 right-4 h-[1px] bg-red-500"
          style={{ top: `${position}px` }}
        >
          <div className="absolute -top-2 -left-12 text-xs text-red-500">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}
