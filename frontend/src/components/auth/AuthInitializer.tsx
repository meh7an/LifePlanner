"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";

export const AuthInitializer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isInitialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth on app startup
    if (!isInitialized) {
      console.log("🚀 Initializing authentication...");
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  // Show loading spinner while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
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
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Life Planner
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Initializing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
