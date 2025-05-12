"use client";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekView() {
  return (
    <div className="flex flex-col w-full h-[90vh] overflow-auto">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b border-gray-300 dark:border-gray-600">
        <div className="bg-gray-50 dark:bg-gray-800" />
        {days.map((day) => (
          <div
            key={day}
            className="text-center py-2 font-medium text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-l border-gray-300 dark:border-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Time slots grid */}
      <div className="flex-1 grid grid-cols-8">
        {/* Time labels */}
        <div className="flex flex-col border-r border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-12 px-2 py-1 border-b border-gray-200 dark:border-gray-700"
            >
              {hour}
            </div>
          ))}
        </div>

        {/* Grid for each day */}
        {days.map((day) => (
          <div
            key={day}
            className="flex flex-col border-l border-gray-300 dark:border-gray-600"
          >
            {hours.map((_, i) => (
              <div
                key={i}
                className="h-12 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
