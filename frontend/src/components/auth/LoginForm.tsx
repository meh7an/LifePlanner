"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, useAuthLoading, useAuthErrors } from "@/lib/stores/authStore";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";

// =============================================================================
// 🎯 VALIDATION SCHEMA
// =============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// =============================================================================
// 🎨 LOGIN FORM COMPONENT
// =============================================================================

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { loginLoading } = useAuthLoading();
  const { loginError, clearErrors } = useAuthErrors();

  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Clear errors when component mounts
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data);
    if (success) {
      reset();
      router.push("/dashboard");
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6">
              <svg
                className="w-12 h-12 text-white"
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to your Life Planner account
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-green-100 dark:border-green-800/30 p-8">
            {/* Error Alert */}
            {loginError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    {loginError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    {...register("email")}
                    type="email"
                    id="email"
                    autoComplete="email"
                    className={`
                      block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm 
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                      dark:bg-gray-700 dark:text-white transition-colors
                      ${
                        errors.email
                          ? "border-red-300 dark:border-red-600"
                          : "border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700"
                      }
                    `}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    className={`
                      block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm 
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                      dark:bg-gray-700 dark:text-white transition-colors
                      ${
                        errors.password
                          ? "border-red-300 dark:border-red-600"
                          : "border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700"
                      }
                    `}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-green-500 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-green-500 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || loginLoading}
                className={`
                  w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white
                  bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  transform hover:scale-105 transition-all duration-200
                  ${loginLoading ? "cursor-wait" : ""}
                `}
              >
                {loginLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
