// app/(auth)/login/page.tsx - Login page using our LoginForm component
"use client";

import React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-green-100 dark:border-green-800/30 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
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
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Sign in to your Life Planner account to continue your productivity
          journey
        </p>
      </div>

      {/* Login Form Component */}
      <LoginForm />

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
          >
            Sign up for free
          </Link>
        </p>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/forgot-password"
            className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </div>

      {/* Demo Account Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Try the Demo
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Want to explore Life Planner? Use these demo credentials:
            </p>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div>
                <strong>Email:</strong> demo@lifeplanner.app
              </div>
              <div>
                <strong>Password:</strong> demo123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
