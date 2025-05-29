"use client";

export default function CalendarGrid() {
  const daysInMonth = 31;
  const startDay = 3;

  const grid = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  return (
    <div className="grid grid-cols-7 gap-2 text-sm text-gray-800 dark:text-gray-200">
      {/* Weekday headers */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="text-center font-medium text-xs text-gray-500 dark:text-gray-400 mb-1"
        >
          {day}
        </div>
      ))}

      {/* Grid cells */}
      {grid.map((day, i) => (
        <div
          key={i}
          className="h-24 border rounded-lg p-2 bg-white dark:bg-gray-800 hover:ring-2 hover:ring-blue-400 transition-all flex flex-col"
        >
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {day || ""}
          </div>
          {day === 5 && (
            <div className="text-xs mt-2 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-1 rounded">
              🧠 Study
            </div>
          )}
          {day === 12 && (
            <div className="text-xs mt-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-1 rounded">
              📝 Exam
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
