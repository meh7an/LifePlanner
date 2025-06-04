// app/page.tsx - Landing page (our beautiful green homepage)
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { redirect } from "next/navigation";

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const [scrollY, setScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      redirect("/dashboard");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 min-h-screen">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
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
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
                  Life Planner
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 dark:from-green-600/5 dark:to-emerald-600/5 transform"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Your Life,{" "}
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Organized
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform chaos into clarity with boards, tasks, calendars, and
                focus sessions all in one beautiful workspace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  Start Planning Today
                </Link>
                <Link
                  href="/login"
                  className="text-green-600 dark:text-green-400 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center space-x-2"
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
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign In</span>
                </Link>
              </div>
            </div>

            {/* Hero Visual - Dashboard Preview */}
            <div
              className="relative max-w-4xl mx-auto"
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-green-100 dark:border-green-800/30 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-white font-medium">
                    Life Planner Dashboard
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Today&apos;s Tasks
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded text-sm">
                          Review quarterly goals
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-2 rounded text-sm">
                          Team standup at 10am
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-2 rounded text-sm">
                          Finish project proposal
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Calendar
                      </h3>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {Array.from({ length: 21 }, (_, i) => (
                          <div
                            key={i}
                            className={`h-6 rounded flex items-center justify-center ${
                              i === 10
                                ? "bg-green-500 text-white"
                                : "bg-white dark:bg-gray-700"
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Focus Session
                      </h3>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          25:00
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Deep Work Time
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Everything You Need to Stay{" "}
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  Productive
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                From quick tasks to complex projects, from daily planning to
                long-term goals - we&apos;ve got you covered.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "📋",
                  title: "Smart Boards",
                  description:
                    "Organize your work and personal life with customizable boards and lists that adapt to your workflow.",
                },
                {
                  icon: "📅",
                  title: "Unified Calendar",
                  description:
                    "See all your events, deadlines, and scheduled tasks in one beautiful calendar view with smart reminders.",
                },
                {
                  icon: "⚡",
                  title: "Focus Sessions",
                  description:
                    "Boost your productivity with built-in focus timers and track your deep work sessions.",
                },
                {
                  icon: "🔄",
                  title: "Smart Repeats",
                  description:
                    "Set up recurring tasks and habits that automatically adapt to your schedule and preferences.",
                },
                {
                  icon: "🤝",
                  title: "Team Collaboration",
                  description:
                    "Share boards and tasks with teammates, family, or friends for seamless collaboration.",
                },
                {
                  icon: "💾",
                  title: "Memory Archive",
                  description:
                    "Never lose important information with our intelligent archiving system that keeps your memories safe.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100 dark:border-green-800/30"
                  style={{
                    transform: `translateY(${
                      Math.sin((scrollY + index * 100) * 0.01) * 10
                    }px)`,
                  }}
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                Productivity?
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already discovered the power of
              organized, focused work.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                Get Started Free
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No credit card required • Free forever plan available
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-green-100 dark:border-green-800/30 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
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

              <div className="flex space-x-6 text-gray-600 dark:text-gray-400">
                <Link
                  href="/privacy"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
              <p>
                &copy; 2025 Life Planner. Made with 💚 for productivity lovers.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
