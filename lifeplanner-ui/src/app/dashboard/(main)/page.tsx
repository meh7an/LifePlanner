"use client";

import Sidebar from "@/components/Sidebar";

export default function DashboardPage() {
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </header>

        <section className="p-6 flex-1 overflow-y-auto">
          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <p className="text-gray-500">📅 Calendar will go here</p>
          </div>
        </section>
      </main>
    </div>
  );
}
