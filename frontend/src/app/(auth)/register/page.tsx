// app/(auth)/register/page.tsx - Register page using our RegisterForm component
"use client";

import React from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Join Life Planner! 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create your free account and start organizing your life today
        </p>
      </div>

      {/* Register Form Component */}
      <RegisterForm />

      {/* Footer Links */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>

      {/* Benefits Section */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
          <span className="text-lg mr-2">✨</span>
          What you&apos;ll get:
        </h4>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Unlimited tasks and boards</li>
          <li>• Advanced calendar integration</li>
          <li>• Focus timer with statistics</li>
          <li>• Team collaboration features</li>
          <li>• Beautiful analytics dashboard</li>
          <li>• File attachments and notes</li>
        </ul>
      </div>
    </div>
  );
}
