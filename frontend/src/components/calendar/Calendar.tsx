// =============================================================================
// 📅 LIFE PLANNER - COMPLETE CALENDAR COMPONENT SYSTEM
// =============================================================================

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarEvent,
  CreateEventRequest,
  EVENT_TYPES,
  CALENDAR_VIEWS,
} from "@/lib/types";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  setHours,
  setMinutes,
  parseISO,
} from "date-fns";

// =============================================================================
// 🎯 CALENDAR UTILITIES
// =============================================================================

const getCalendarDays = (date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

const getWeekDays = (date: Date) => {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

const getEventsByDate = (events: CalendarEvent[], date: Date) => {
  return events.filter((event) => {
    const eventDate = parseISO(event.startTime);
    return isSameDay(eventDate, date);
  });
};

const getEventColor = (eventType: CalendarEvent["eventType"]) => {
  const colors = {
    meeting: "bg-blue-500",
    task: "bg-green-500",
    reminder: "bg-yellow-500",
    personal: "bg-purple-500",
    work: "bg-indigo-500",
    other: "bg-gray-500",
  };
  return colors[eventType] || colors.other;
};

// =============================================================================
// 🗓️ EVENT MODAL COMPONENT
// =============================================================================

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  selectedDate?: Date;
  calendarId?: string;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedDate,
  calendarId,
}) => {
  const { calendars, createEvent, updateEvent, deleteEvent } =
    useCalendarStore();
  const { tasks } = useTaskStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState<CreateEventRequest>({
    startTime: selectedDate
      ? selectedDate.toISOString()
      : new Date().toISOString(),
    endTime: selectedDate
      ? addDays(selectedDate, 0).toISOString()
      : new Date().toISOString(),
    eventType: "meeting",
    calendarId: calendarId || calendars[0]?.id || "",
    alarm: false,
    reminder: 15,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        calendarId: event.calendarId,
        alarm: event.alarm || false,
        reminder: event.reminder || 15,
        taskId: event.taskId || undefined,
      });
    } else if (selectedDate) {
      const startTime = setHours(setMinutes(selectedDate, 0), 9);
      const endTime = setHours(setMinutes(selectedDate, 0), 10);
      setFormData((prev) => ({
        ...prev,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }));
    }
  }, [event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (event) {
        const success = await updateEvent(event.id, formData);
        if (success) {
          addNotification({
            id: crypto.randomUUID(),
            type: "system_announcement",
            title: "Event Updated! 🎉",
            message: "Your event has been updated successfully.",
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });
          onClose();
        }
      } else {
        const success = await createEvent(formData);
        if (success) {
          addNotification({
            id: crypto.randomUUID(),
            type: "system_announcement",
            title: "Event Created! ✨",
            message: "Your new event has been added to the calendar.",
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });
          onClose();
        }
      }
    } catch (error) {
      console.error("Error saving event:", error);
      setErrors({ general: "Failed to save event. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setLoading(true);
    try {
      const success = await deleteEvent(event.id);
      if (success) {
        addNotification({
          id: crypto.randomUUID(),
          type: "system_announcement",
          title: "Event Deleted! 🗑️",
          message: "The event has been removed from your calendar.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: "system",
        });
        onClose();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      setErrors({ general: "Failed to delete event. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-green-100 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event ? "Edit Event" : "Create Event"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
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
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.general}
              </p>
            </div>
          )}

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <select
              value={formData.eventType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  eventType: e.target.value as CalendarEvent["eventType"],
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Calendar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calendar
            </label>
            <select
              value={formData.calendarId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, calendarId: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime.slice(0, 16)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: new Date(e.target.value).toISOString(),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.endTime.slice(0, 16)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endTime: new Date(e.target.value).toISOString(),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                required
              />
            </div>
          </div>

          {/* Task Link */}
          {tasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link to Task (Optional)
              </label>
              <select
                value={formData.taskId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    taskId: e.target.value || undefined,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="">No task linked</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.taskName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reminder Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="alarm"
                checked={formData.alarm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, alarm: e.target.checked }))
                }
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label
                htmlFor="alarm"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Enable alarm notification
              </label>
            </div>

            {formData.alarm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remind me (minutes before)
                </label>
                <select
                  value={formData.reminder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reminder: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={1440}>1 day</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Event
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading
                  ? "Saving..."
                  : event
                  ? "Update Event"
                  : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// 📅 MONTH VIEW COMPONENT
// =============================================================================

interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onCreateEvent,
}) => {
  const days = useMemo(() => getCalendarDays(selectedDate), [selectedDate]);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/30">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-4 text-center text-sm font-semibold text-green-700 dark:text-green-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsByDate(events, day);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer ${
                !isCurrentMonth ? "bg-gray-50 dark:bg-gray-900/50" : ""
              } ${isSelected ? "bg-green-100 dark:bg-green-900/30" : ""}`}
              onClick={() => {
                onDateSelect(day);
                if (dayEvents.length === 0) {
                  onCreateEvent(day);
                }
              }}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    isDayToday
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : ""
                  }
                  ${
                    isSelected && !isDayToday
                      ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                      : ""
                  }
                  ${
                    !isCurrentMonth
                      ? "text-gray-400 dark:text-gray-600"
                      : "text-gray-900 dark:text-white"
                  }
                `}
                >
                  {format(day, "d")}
                </div>
                {dayEvents.length > 0 && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`
                      px-2 py-1 rounded text-xs font-medium text-white truncate cursor-pointer hover:opacity-80 transition-opacity
                      ${getEventColor(event.eventType)}
                    `}
                  >
                    {format(parseISO(event.startTime), "HH:mm")}{" "}
                    {event.task?.taskName || `${event.eventType}`}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// 📅 WEEK VIEW COMPONENT
// =============================================================================

interface WeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
}

// Helper function to calculate event positioning and overlaps
const calculateEventLayout = (events: CalendarEvent[], weekDays: Date[]) => {
  const eventLayouts: Array<{
    event: CalendarEvent;
    dayIndex: number;
    startHour: number;
    duration: number; // in hours
    spans: number; // number of days it spans
    column: number; // for overlapping events
    width: number; // width percentage
    left: number; // left offset percentage
  }> = [];

  // Group events by day
  const eventsByDay = weekDays.map((day, dayIndex) => {
    const dayEvents = events
      .filter((event) => {
        const eventStart = parseISO(event.startTime);
        const eventEnd = parseISO(event.endTime);

        // Check if event intersects with this day
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return eventStart <= dayEnd && eventEnd >= dayStart;
      })
      .map((event) => {
        const eventStart = parseISO(event.startTime);
        const eventEnd = parseISO(event.endTime);

        // Calculate how this event appears on this specific day
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // Clamp the event times to this day's boundaries
        const displayStart = eventStart < dayStart ? dayStart : eventStart;
        const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

        const startHour =
          displayStart.getHours() + displayStart.getMinutes() / 60;
        const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;
        const duration = endHour - startHour;

        // Calculate total span in days
        const totalStart = eventStart;
        const totalEnd = eventEnd;
        const daysDiff = Math.ceil(
          (totalEnd.getTime() - totalStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        const spans = Math.max(1, daysDiff);

        return {
          event,
          dayIndex,
          startHour,
          duration: Math.max(0.5, duration), // Minimum 30 minutes display
          spans,
          originalStart: eventStart,
          originalEnd: eventEnd,
        };
      })
      .sort((a, b) => {
        // Sort by start time, then by duration (longer events first)
        if (a.startHour !== b.startHour) {
          return a.startHour - b.startHour;
        }
        return b.duration - a.duration;
      });

    return { dayIndex, events: dayEvents };
  });

  // Calculate overlaps and positioning for each day
  eventsByDay.forEach(({ dayIndex, events: dayEvents }) => {
    const overlappingGroups: Array<Array<(typeof dayEvents)[0]>> = [];

    dayEvents.forEach((eventData) => {
      // Find which group this event belongs to (based on time overlap)
      const groupIndex = overlappingGroups.findIndex((group) =>
        group.some((groupEvent) => {
          const eventEnd = eventData.startHour + eventData.duration;
          const groupEventEnd = groupEvent.startHour + groupEvent.duration;

          // Check if they overlap in time
          return !(
            eventEnd <= groupEvent.startHour ||
            eventData.startHour >= groupEventEnd
          );
        })
      );

      if (groupIndex === -1) {
        // Create new group
        overlappingGroups.push([eventData]);
      } else {
        // Add to existing group
        overlappingGroups[groupIndex].push(eventData);
      }
    });

    // Process each overlapping group
    overlappingGroups.forEach((group) => {
      const groupSize = group.length;

      group.forEach((eventData, index) => {
        const column = index;
        let width = 100 / groupSize;
        let left = (100 / groupSize) * index;

        // For nested events (smaller inside bigger), adjust positioning
        if (groupSize > 1) {
          // Sort by duration to identify nesting relationships
          const sortedGroup = [...group].sort(
            (a, b) => b.duration - a.duration
          );
          const currentEventIndex = sortedGroup.findIndex(
            (e) => e.event.id === eventData.event.id
          );

          if (currentEventIndex > 0) {
            // This is a nested event
            const padding = 8; // 8% padding
            width = width - padding;
            left = left + padding / 2;
          }
        }

        eventLayouts.push({
          event: eventData.event,
          dayIndex,
          startHour: eventData.startHour,
          duration: eventData.duration,
          spans: eventData.spans,
          column,
          width,
          left,
        });
      });
    });
  });

  return eventLayouts;
};

const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onCreateEvent,
}) => {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const eventLayouts = useMemo(
    () => calculateEventLayout(events, weekDays),
    [events, weekDays]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-green-100 dark:border-green-800/30">
        <div className="p-4 bg-green-50 dark:bg-green-900/20"></div>
        {weekDays.map((day, index) => {
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`p-4 text-center border-r border-green-100 dark:border-green-800/30 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${
                isDayToday
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-green-50 dark:bg-green-900/20"
              } ${isSelected ? "ring-2 ring-green-500" : ""}`}
            >
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {dayNames[day.getDay()].slice(0, 3)}
              </div>
              <div
                className={`text-lg font-semibold mt-1 ${
                  isDayToday
                    ? "text-green-700 dark:text-green-300"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {format(day, "d")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time Grid with Enhanced Event Positioning */}
      <div className="max-h-96 overflow-y-auto relative">
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700 relative"
            style={{ height: "60px" }}
          >
            {/* Time Label */}
            <div className="p-2 text-right text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 min-w-0 flex items-start">
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>

            {/* Day Columns */}
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-gray-100 dark:border-gray-700 relative hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer"
                onClick={() => {
                  const clickedTime = setHours(setMinutes(day, 0), hour);
                  onCreateEvent(clickedTime);
                }}
                style={{ height: "60px" }}
              >
                {/* Click area indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="text-xs text-gray-400 dark:text-gray-600 pointer-events-none">
                    +
                  </div>
                </div>
              </div>
            ))}

            {/* Render events that start in this hour */}
            {eventLayouts
              .filter((layout) => Math.floor(layout.startHour) === hour)
              .map((layout) => {
                const startMinute = (layout.startHour % 1) * 60;
                const heightInPixels = layout.duration * 60; // 60px per hour
                const topOffset = startMinute; // pixels from top of hour

                return (
                  <div
                    key={layout.event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(layout.event);
                    }}
                    className={`
                      absolute rounded-md text-white text-xs cursor-pointer hover:opacity-80 transition-all z-10 overflow-hidden
                      ${getEventColor(layout.event.eventType)}
                    `}
                    style={{
                      left: `${
                        12.5 +
                        layout.dayIndex * 12.5 +
                        (layout.left * 12.5) / 100
                      }%`,
                      width: `${(layout.width * 12.5) / 100}%`,
                      top: `${topOffset}px`,
                      height: `${Math.max(30, heightInPixels)}px`, // Minimum 30px height
                      zIndex: layout.spans > 1 ? 20 : 10, // Multi-day events on top
                    }}
                  >
                    <div className="p-2 h-full flex flex-col">
                      {/* Event Title */}
                      <div className="font-medium truncate text-xs leading-tight">
                        {layout.event.task?.taskName || layout.event.eventType}
                      </div>

                      {/* Time Display */}
                      {layout.duration >= 1 && ( // Only show time if event is at least 1 hour
                        <div className="text-xs opacity-90 mt-1 truncate">
                          {format(parseISO(layout.event.startTime), "HH:mm")} -{" "}
                          {format(parseISO(layout.event.endTime), "HH:mm")}
                        </div>
                      )}

                      {/* Multi-day indicator */}
                      {layout.spans > 1 && (
                        <div className="text-xs opacity-75 mt-1 flex items-center">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                          </svg>
                          {layout.spans}d
                        </div>
                      )}

                      {/* Alarm indicator */}
                      {layout.event.alarm && layout.duration >= 0.75 && (
                        <div className="text-xs opacity-75 mt-1 flex items-center">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-5 5v-5zM8.5 14.5A2.5 2.5 0 018 12V7a4 4 0 118 0v5a2.5 2.5 0 01-.5 2.5L12 17l-3.5-2.5z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// 📅 DAY VIEW COMPONENT
// =============================================================================

// =============================================================================
// 📅 ENHANCED DAY VIEW COMPONENT WITH MULTI-HOUR EVENTS
// =============================================================================

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
}

// Helper function to calculate event positioning and overlaps for day view
const calculateDayEventLayout = (
  events: CalendarEvent[],
  selectedDate: Date
) => {
  const dayEvents = events
    .filter((event) => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);

      // Check if event intersects with selected day
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      return eventStart <= dayEnd && eventEnd >= dayStart;
    })
    .map((event) => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);

      // Clamp the event times to this day's boundaries
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const displayStart = eventStart < dayStart ? dayStart : eventStart;
      const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

      const startHour =
        displayStart.getHours() + displayStart.getMinutes() / 60;
      const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;
      const duration = endHour - startHour;

      // Check if this is a multi-day event
      const isMultiDay = eventStart < dayStart || eventEnd > dayEnd;
      const totalDays = Math.ceil(
        (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        event,
        startHour,
        duration: Math.max(0.5, duration), // Minimum 30 minutes display
        originalStart: eventStart,
        originalEnd: eventEnd,
        isMultiDay,
        totalDays: Math.max(1, totalDays),
      };
    })
    .sort((a, b) => {
      // Sort by start time, then by duration (longer events first)
      if (a.startHour !== b.startHour) {
        return a.startHour - b.startHour;
      }
      return b.duration - a.duration;
    });

  // Group overlapping events
  const overlappingGroups: Array<Array<(typeof dayEvents)[0]>> = [];

  dayEvents.forEach((eventData) => {
    // Find which group this event belongs to (based on time overlap)
    const groupIndex = overlappingGroups.findIndex((group) =>
      group.some((groupEvent) => {
        const eventEnd = eventData.startHour + eventData.duration;
        const groupEventEnd = groupEvent.startHour + groupEvent.duration;

        // Check if they overlap in time
        return !(
          eventEnd <= groupEvent.startHour ||
          eventData.startHour >= groupEventEnd
        );
      })
    );

    if (groupIndex === -1) {
      // Create new group
      overlappingGroups.push([eventData]);
    } else {
      // Add to existing group
      overlappingGroups[groupIndex].push(eventData);
    }
  });

  // Calculate positioning for each event
  const eventLayouts: Array<{
    event: CalendarEvent;
    startHour: number;
    duration: number;
    width: number;
    left: number;
    isMultiDay: boolean;
    totalDays: number;
  }> = [];

  overlappingGroups.forEach((group) => {
    const groupSize = group.length;
    const gapSize = groupSize > 1 ? 2 : 0; // 2% gap between columns when overlapping

    group.forEach((eventData, index) => {
      // Calculate width and position with gaps
      const availableWidth = 100 - gapSize * (groupSize - 1);
      const width = availableWidth / groupSize;
      const left = (width + gapSize) * index;

      eventLayouts.push({
        event: eventData.event,
        startHour: eventData.startHour,
        duration: eventData.duration,
        width,
        left,
        isMultiDay: eventData.isMultiDay,
        totalDays: eventData.totalDays,
      });
    });
  });

  return eventLayouts;
};

const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  events,
  onEventClick,
  onCreateEvent,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const eventLayouts = useMemo(
    () => calculateDayEventLayout(events, selectedDate),
    [events, selectedDate]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 overflow-hidden">
      {/* Day Header */}
      <div className="p-6 border-b border-green-100 dark:border-green-800/30 bg-green-50 dark:bg-green-900/20">
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <p className="text-green-600 dark:text-green-400 mt-1">
          {eventLayouts.length} {eventLayouts.length === 1 ? "event" : "events"}{" "}
          scheduled
        </p>
      </div>

      {/* Time Slots with Enhanced Event Positioning */}
      <div className="max-h-96 overflow-y-auto relative">
        {hours.map((hour) => {
          return (
            <div
              key={hour}
              className="flex border-b border-gray-100 dark:border-gray-700 relative"
              style={{ height: "80px" }} // Increased height for better visibility
            >
              {/* Time Label */}
              <div
                className="w-20 p-3 text-right text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 flex items-start hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer transition-colors"
                onClick={() => {
                  const clickedTime = setHours(
                    setMinutes(selectedDate, 0),
                    hour
                  );
                  onCreateEvent(clickedTime);
                }}
              >
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </div>

              {/* Main Content Area */}
              <div
                className="flex-1 relative hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer"
                onClick={() => {
                  const clickedTime = setHours(
                    setMinutes(selectedDate, 0),
                    hour
                  );
                  onCreateEvent(clickedTime);
                }}
                style={{ height: "80px" }}
              >
                {/* Empty slot indicator */}
                {eventLayouts.filter(
                  (layout) => Math.floor(layout.startHour) === hour
                ).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-gray-400 dark:text-gray-600 text-sm italic pointer-events-none">
                      Click to add event
                    </div>
                  </div>
                )}

                {/* Render events that start in this hour */}
                {eventLayouts
                  .filter((layout) => Math.floor(layout.startHour) === hour)
                  .map((layout) => {
                    const startMinute = (layout.startHour % 1) * 80; // 80px per hour
                    const heightInPixels = layout.duration * 80;
                    const topOffset = startMinute;

                    return (
                      <div
                        key={layout.event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(layout.event);
                        }}
                        className={`
                          absolute rounded-lg cursor-pointer hover:opacity-80 transition-all shadow-sm border border-white/20 overflow-hidden
                          ${getEventColor(layout.event.eventType)} text-white
                        `}
                        style={{
                          left: `${layout.left}%`, // Percentage of this flex-1 container
                          width: `${layout.width}%`, // Width as percentage of this container
                          top: `${topOffset}px`,
                          height: `${Math.max(40, heightInPixels)}px`, // Minimum 40px height
                          zIndex: layout.isMultiDay ? 20 : 10, // Multi-day events on top
                        }}
                      >
                        <div className="p-3 h-full flex flex-col">
                          {/* Event Title */}
                          <div className="font-semibold text-sm leading-tight">
                            {layout.event.task?.taskName ||
                              layout.event.eventType}
                          </div>

                          {/* Time Display */}
                          {layout.duration >= 0.75 && (
                            <div className="text-xs opacity-90 mt-1">
                              {format(
                                parseISO(layout.event.startTime),
                                "h:mm a"
                              )}{" "}
                              -{" "}
                              {format(parseISO(layout.event.endTime), "h:mm a")}
                            </div>
                          )}

                          {/* Multi-day indicator */}
                          {layout.isMultiDay && (
                            <div className="text-xs opacity-75 mt-1 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                />
                              </svg>
                              {layout.totalDays} day event
                            </div>
                          )}

                          {/* Event type badge for longer events */}
                          {layout.duration >= 1.5 && (
                            <div className="text-xs opacity-75 mt-auto">
                              <span className="bg-white/20 px-2 py-1 rounded-full capitalize">
                                {layout.event.eventType}
                              </span>
                            </div>
                          )}

                          {/* Alarm indicator */}
                          {layout.event.alarm && layout.duration >= 1 && (
                            <div className="text-xs opacity-75 mt-1 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 17h5l-5 5v-5zM8.5 14.5A2.5 2.5 0 018 12V7a4 4 0 118 0v5a2.5 2.5 0 01-.5 2.5L12 17l-3.5-2.5z"
                                />
                              </svg>
                              Reminder set
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// =============================================================================
// 🗓️ MAIN CALENDAR COMPONENT
// =============================================================================

interface CalendarProps {
  className?: string;
}

const CalendarComponent: React.FC<CalendarProps> = ({ className = "" }) => {
  const {
    calendars,
    events,
    selectedDate,
    view,
    eventsLoading,
    calendarsLoading,
    setSelectedDate,
    setView,
    navigateDate,
    fetchCalendars,
    fetchEvents,
  } = useCalendarStore();

  const [eventModal, setEventModal] = useState({
    isOpen: false,
    event: null as CalendarEvent | null,
    selectedDate: null as Date | null,
  });

  useEffect(() => {
    fetchCalendars();
    fetchEvents();
  }, [fetchCalendars, fetchEvents]);

  const handleNavigate = (direction: "prev" | "next") => {
    navigateDate(direction);
  };

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCreateEvent = (date: Date) => {
    setEventModal({
      isOpen: true,
      event: null,
      selectedDate: date,
    });
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEventModal({
      isOpen: true,
      event,
      selectedDate: null,
    });
  };

  const closeEventModal = () => {
    setEventModal({
      isOpen: false,
      event: null,
      selectedDate: null,
    });
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  if (calendarsLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Title & Navigation */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              {view === "month" && format(selectedDate, "MMMM yyyy")}
              {view === "week" &&
                `Week of ${format(selectedDate, "MMM d, yyyy")}`}
              {view === "day" && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h1>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigate("prev")}
                className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
                disabled={eventsLoading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={handleTodayClick}
                className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                disabled={eventsLoading}
              >
                Today
              </button>

              <button
                onClick={() => handleNavigate("next")}
                className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
                disabled={eventsLoading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {CALENDAR_VIEWS.map((viewOption) => (
                <button
                  key={viewOption}
                  onClick={() => handleViewChange(viewOption as typeof view)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    view === viewOption
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                  }`}
                  disabled={eventsLoading}
                >
                  {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                </button>
              ))}
            </div>

            {/* Create Event Button */}
            <button
              onClick={() => handleCreateEvent(selectedDate)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              disabled={eventsLoading}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Calendar Summary */}
        {events.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>
                {events.filter((e) => e.eventType === "task").length} Tasks
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>
                {events.filter((e) => e.eventType === "meeting").length}{" "}
                Meetings
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>
                {events.filter((e) => e.eventType === "personal").length}{" "}
                Personal
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>
                {events.filter((e) => e.eventType === "reminder").length}{" "}
                Reminders
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Views */}
      {eventsLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <div>
          {view === "month" && (
            <MonthView
              selectedDate={selectedDate}
              events={events}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />
          )}

          {view === "week" && (
            <WeekView
              selectedDate={selectedDate}
              events={events}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />
          )}

          {view === "day" && (
            <DayView
              selectedDate={selectedDate}
              events={events}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />
          )}
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={eventModal.isOpen}
        onClose={closeEventModal}
        event={eventModal.event}
        selectedDate={eventModal.selectedDate || undefined}
        calendarId={calendars[0]?.id}
      />
    </div>
  );
};

// =============================================================================
// 📱 MINI CALENDAR COMPONENT (for sidebars)
// =============================================================================

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: CalendarEvent[];
  className?: string;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onDateSelect,
  events = [],
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  return (
    <div
      className={`${className} bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 p-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, "MMM yyyy")}
        </h3>
        <div className="flex space-x-1">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth("next")}
            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const hasEvents = events.some((event) =>
            isSameDay(parseISO(event.startTime), day)
          );

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`
                w-8 h-8 text-xs rounded-lg transition-colors relative
                ${
                  isDayToday
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium"
                    : ""
                }
                ${
                  isSelected && !isDayToday
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium"
                    : ""
                }
                ${
                  !isCurrentMonth
                    ? "text-gray-400 dark:text-gray-600"
                    : "text-gray-900 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/20"
                }
              `}
            >
              {format(day, "d")}
              {hasEvents && isCurrentMonth && (
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// 📅 UPCOMING EVENTS WIDGET
// =============================================================================

interface UpcomingEventsProps {
  events: CalendarEvent[];
  limit?: number;
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  limit = 5,
  className = "",
  onEventClick,
}) => {
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => parseISO(event.startTime) > now)
      .sort(
        (a, b) =>
          parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
      )
      .slice(0, limit);
  }, [events, limit]);

  if (upcomingEvents.length === 0) {
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Upcoming Events
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>No upcoming events</p>
          <p className="text-sm mt-1">Your calendar is clear!</p>
        </div>
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Upcoming Events
      </h3>

      <div className="space-y-3">
        {upcomingEvents.map((event) => {
          const eventDate = parseISO(event.startTime);
          const isToday = isSameDay(eventDate, new Date());
          const isTomorrow = isSameDay(eventDate, addDays(new Date(), 1));

          return (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
            >
              <div
                className={`w-3 h-3 rounded-full mt-1.5 ${getEventColor(
                  event.eventType
                )}`}
              ></div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {event.task?.taskName || event.eventType}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isToday
                    ? "Today"
                    : isTomorrow
                    ? "Tomorrow"
                    : format(eventDate, "MMM d")}{" "}
                  at {format(eventDate, "h:mm a")}
                </div>
                {event.alarm && (
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5zM8.5 14.5A2.5 2.5 0 018 12V7a4 4 0 118 0v5a2.5 2.5 0 01-.5 2.5L12 17l-3.5-2.5z"
                      />
                    </svg>
                    Reminder set
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                {event.eventType}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// 🚀 EXPORT ALL COMPONENTS
// =============================================================================

export {
  CalendarComponent as Calendar,
  MonthView,
  WeekView,
  DayView,
  EventModal,
  MiniCalendar,
  UpcomingEvents,
};

export default CalendarComponent;
