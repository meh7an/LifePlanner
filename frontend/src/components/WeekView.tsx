"use client";

import { useState } from "react";
import CreateTaskModal from "./CreateTaskModal";

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

function getGMTLabel(): string {
  const offset = new Date().getTimezoneOffset() / -60;
  return `GMT${offset >= 0 ? "+" : ""}${offset}`;
}

// ✅ Accept selectedDate as a prop
export default function WeekView({ selectedDate }: { selectedDate: Date }) {
  const today = new Date();
  const weekNumber = getWeekNumber(selectedDate);
  const todayDay = selectedDate.getDay();

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - todayDay);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<
    { name: string; start: Date; end: Date }[]
  >([]);

  const handleSlotClick = (dayIndex: number, hour: number) => {
    const selected = new Date(startOfWeek);
    selected.setDate(startOfWeek.getDate() + dayIndex);
    selected.setHours(hour, 0, 0, 0);
    setSelectedTime(selected);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full flex-1 overflow-hidden">
      {/* Weekday Header with GMT */}
      <div className="grid grid-cols-[60px_repeat(7,_1fr)] border-b border-gray-300 dark:border-gray-700 text-sm">
        <div className="flex items-center justify-center text-[11px] text-gray-500">
          {getGMTLabel()}
        </div>
        {days.map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + index);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={day}
              className="relative text-center py-2 font-medium border-l border-gray-300 dark:border-gray-700"
            >
              <div
                className={`text-sm ${
                  isToday
                    ? "font-bold text-[15px]"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {day}
              </div>
              <div
                className={`text-xs ${isToday ? "text-lg font-semibold" : ""}`}
              >
                {date.getDate()}
              </div>
              {isToday && (
                <div className="w-1 h-1 rounded-full bg-red-500 mx-auto mt-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,_1fr)]">
          {/* Time Labels */}
          <div className="flex flex-col w-[60px] border-r border-gray-300 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500">
            {hours.map((hour, i) => (
              <div
                key={i}
                className="h-[48px] px-1 py-0.5 border-b border-gray-100 dark:border-gray-800"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Calendar Columns */}
          {days.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="flex flex-col border-l border-gray-300 dark:border-gray-700"
            >
              {hours.map((_, hour) => {
                const cellDate = new Date(startOfWeek);
                cellDate.setDate(startOfWeek.getDate() + dayIndex);
                cellDate.setHours(hour, 0, 0, 0);

                const matchingTask = tasks.find(
                  (t) => t.start.toISOString() === cellDate.toISOString()
                );

                const isInsideTask = tasks.find(
                  (t) => cellDate > t.start && cellDate < t.end
                );

                return (
                  <div
                    key={hour}
                    onClick={() => handleSlotClick(dayIndex, hour)}
                    className="h-[48px] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer relative"
                  >
                    {matchingTask && (
                      <div
                        className="absolute top-1 left-1 right-1 text-xs bg-blue-500 text-white px-2 py-1 rounded shadow-md"
                        style={{
                          height:
                            ((matchingTask.end.getTime() -
                              matchingTask.start.getTime()) /
                              (1000 * 60 * 60)) *
                            48,
                        }}
                      >
                        {matchingTask.name}
                        <div className="text-[10px]">
                          {matchingTask.start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {matchingTask.end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    )}
                    {isInsideTask && <div className="hidden" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {selectedTime && (
        <CreateTaskModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={selectedTime}
          onCreate={(task) => {
            setTasks((prev) => [
              ...prev,
              { name: task.name, start: task.start, end: task.end },
            ]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
