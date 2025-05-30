"use client";

import { Boards } from "@/components/board/Board";
import React from "react";

export default function BoardsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
          Project Boards
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Organize your projects with Kanban-style boards and lists
        </p>
      </div>

      <Boards />
    </div>
  );
}
