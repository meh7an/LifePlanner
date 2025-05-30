"use client";

import React from "react";
import { Calendar } from "@/components/calendar/Calendar";

export default function CalendarPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
          Calendar & Events
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Schedule your time and manage events across all your calendars
        </p>
      </div>

      <Calendar />
    </div>
  );
}
