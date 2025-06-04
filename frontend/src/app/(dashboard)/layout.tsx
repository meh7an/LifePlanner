"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useUIStore } from "@/lib/stores/uiStore";
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown";
import Link from "next/link";
import GlobalSearchSystem from "@/components/search/GlobalSearchSystem";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    toggleSidebar,
    rightPanelOpen,
    rightPanelContent,
    closeRightPanel,
  } = useUIStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "📊",
      active: pathname === "/dashboard",
    },
    {
      name: "Tasks",
      href: "/dashboard/tasks",
      icon: "✅",
      active: pathname === "/dashboard/tasks",
    },
    {
      name: "Boards",
      href: "/dashboard/boards",
      icon: "📋",
      active: pathname === "/dashboard/boards",
    },
    {
      name: "Calendar",
      href: "/dashboard/calendar",
      icon: "📅",
      active: pathname === "/dashboard/calendar",
    },
    {
      name: "Focus",
      href: "/dashboard/focus",
      icon: "⚡",
      active: pathname === "/dashboard/focus",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: "📈",
      active: pathname === "/dashboard/analytics",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: "⚙️",
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <ProtectedRoute>
      <div
        className={`h-screen flex transition-colors duration-300 ${
          isDarkMode ? "dark" : ""
        }`}
      >
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 h-screen flex w-full">
          {/* Sidebar */}
          <aside
            className={`transition-all duration-300 ${
              sidebarOpen ? "w-64" : "w-22"
            } bg-white dark:bg-gray-800 border-r border-green-100 dark:border-green-800/30 flex flex-col`}
          >
            {/* Logo */}
            <div className="p-4 border-b border-green-100 dark:border-green-800/30">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
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
                </div>
                {sidebarOpen && (
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
                    Life Planner
                  </span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                        item.active
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      {sidebarOpen && (
                        <span className="font-medium truncate">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30 px-6 py-4 flex items-center justify-between">
              {/* Left Side - Menu Toggle & Breadcrumbs */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors text-gray-600 dark:text-gray-300"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Breadcrumbs */}
                <div className="flex items-center space-x-2 text-sm">
                  <Link
                    href="/dashboard"
                    className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                  {pathname !== "/dashboard" && (
                    <>
                      <span className="text-gray-400 dark:text-gray-500">
                        /
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">
                        {pathname.split("/").pop()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side - Search & Profile */}
              <div className="flex items-center space-x-4">
                <GlobalSearchSystem />
                <UserProfileDropdown />
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>

          {/* Right Panel */}
          {rightPanelOpen && rightPanelContent && (
            <aside className="w-80 bg-white dark:bg-gray-800 border-l border-green-100 dark:border-green-800/30 flex flex-col">
              <div className="p-4 border-b border-green-100 dark:border-green-800/30 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {rightPanelContent}
                </h2>
                <button
                  onClick={closeRightPanel}
                  className="p-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-gray-500 dark:text-gray-400"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {rightPanelContent} panel content will be displayed here. This
                  could include detailed task management, calendar events, focus
                  session controls, and more.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
