"use client";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function WeekView() {
  const today = new Date();
  const todayDay = today.getDay(); // 0 (Sun) to 6 (Sat)
  const weekNumber = getWeekNumber(today);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayDay); // Set to Sunday

  return (
    <div className="flex flex-col w-full h-[90vh] overflow-auto">
      {/* Header: Week Info */}
      <div className="px-4 py-3 flex justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-semibold">
          {today.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}{" "}
          · Week {weekNumber}
        </h2>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-8 border-b border-gray-300 dark:border-gray-600">
        <div className="bg-gray-50 dark:bg-gray-800" />
        {days.map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + index);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={day}
              className={`text-center py-2 font-medium text-sm border-l border-gray-300 dark:border-gray-600 ${
                isToday
                  ? "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-white"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <div>{day}</div>
              <div className="text-xs">{date.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 grid grid-cols-8">
        {/* Time Labels */}
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

        {/* Day Columns */}
        {days.map((_, index) => (
          <div
            key={index}
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
