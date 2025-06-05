"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";

const UserProfilePage = () => {
  const { user, updateProfile, changePassword, uploadAvatar, profileLoading } =
    useAuthStore();
  const { addNotification, theme, setTheme } = useUIStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "preferences" | "account"
  >("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await updateProfile(profileData);
      if (success) {
        addNotification({
          id: Math.random().toString(36).substr(2, 9),
          type: "system_announcement",
          title: "Profile Updated! 🎉",
          message: "Your profile information has been successfully updated.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: user?.id ?? "system",
        });
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "Update Failed",
        message: "Failed to update profile. Please try again.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "Password Mismatch",
        message: "New password and confirmation do not match.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "Weak Password",
        message: "Password must be at least 8 characters long.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (success) {
        addNotification({
          id: Math.random().toString(36).substr(2, 9),
          type: "system_announcement",
          title: "Password Changed! 🔒",
          message: "Your password has been successfully updated.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: user?.id ?? "system",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Password change failed:", error);
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "Password Change Failed",
        message:
          "Failed to change password. Please check your current password.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "Invalid File Type",
        message: "Please select an image file.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "File Too Large",
        message: "Image must be smaller than 5MB.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    try {
      const success = await uploadAvatar(file);
      if (success) {
        addNotification({
          id: Math.random().toString(36).substr(2, 9),
          type: "system_announcement",
          title: "Avatar Updated! 📸",
          message: "Your profile picture has been successfully updated.",
          read: false,
          createdAt: new Date().toISOString(),
          userId: user?.id ?? "system",
        });
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: "system_announcement",
        title: "Upload Failed",
        message: "Failed to upload avatar. Please try again.",
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.id ?? "system",
      });
      setAvatarPreview(null);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6)
      return { strength: 1, label: "Weak", color: "text-red-500" };
    if (password.length < 8)
      return { strength: 2, label: "Fair", color: "text-yellow-500" };
    if (password.length < 12)
      return { strength: 3, label: "Good", color: "text-blue-500" };
    return { strength: 4, label: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "password", label: "Password", icon: "🔒" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "account", label: "Account", icon: "🗂️" },
  ] as const;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 min-h-screen">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Profile Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-green-100 dark:border-green-800/30 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-green-100 dark:border-green-800/30">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600 dark:text-green-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Profile Information
                    </h2>

                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-green-200 dark:border-green-700">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                            width={96}
                            height={96}
                            unoptimized
                          />
                        ) : user?.profilePicture ? (
                          <Image
                            src={user.profilePicture}
                            alt="Current avatar"
                            className="w-full h-full object-cover"
                            width={96}
                            height={96}
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                        {profileLoading && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Profile Picture
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          JPG, GIF or PNG. Max size 5MB.
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={profileLoading}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                        >
                          {profileLoading ? "Uploading..." : "Change Avatar"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            value={profileData.username}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                username: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                            placeholder="Your username"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={profileData.email}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg flex items-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Change Password
                    </h2>

                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="Enter your current password"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="Enter your new password"
                          required
                        />
                        {passwordData.newPassword && (
                          <div className="mt-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    passwordStrength.strength === 1
                                      ? "bg-red-500 w-1/4"
                                      : passwordStrength.strength === 2
                                      ? "bg-yellow-500 w-2/4"
                                      : passwordStrength.strength === 3
                                      ? "bg-blue-500 w-3/4"
                                      : passwordStrength.strength === 4
                                      ? "bg-green-500 w-full"
                                      : "w-0"
                                  }`}
                                ></div>
                              </div>
                              <span
                                className={`text-sm font-medium ${passwordStrength.color}`}
                              >
                                {passwordStrength.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Use at least 8 characters with a mix of letters,
                              numbers & symbols
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="Confirm your new password"
                          required
                        />
                        {passwordData.confirmPassword &&
                          passwordData.newPassword !==
                            passwordData.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">
                              Passwords do not match
                            </p>
                          )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={
                            isSubmitting ||
                            passwordData.newPassword !==
                              passwordData.confirmPassword
                          }
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg flex items-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Changing...</span>
                            </>
                          ) : (
                            <>
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
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                              <span>Change Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      App Preferences
                    </h2>

                    <div className="space-y-6">
                      {/* Theme Settings */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className="text-xl mr-2">🎨</span>
                          Theme & Appearance
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Theme Mode
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Choose your preferred theme
                              </p>
                            </div>
                            <select
                              value={theme}
                              onChange={(e) =>
                                setTheme(
                                  e.target.value as "light" | "dark" | "system"
                                )
                              }
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            >
                              <option value="light">Light</option>
                              <option value="dark">Dark</option>
                              <option value="system">System</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className="text-xl mr-2">🔔</span>
                          Notifications
                        </h3>
                        <div className="space-y-4">
                          {[
                            {
                              id: "task_reminders",
                              label: "Task Due Reminders",
                              description:
                                "Get notified when tasks are due soon",
                            },
                            {
                              id: "focus_sessions",
                              label: "Focus Session Alerts",
                              description:
                                "Notifications for focus session start/end",
                            },
                            {
                              id: "calendar_events",
                              label: "Calendar Reminders",
                              description:
                                "Alerts for upcoming calendar events",
                            },
                            {
                              id: "collaboration",
                              label: "Collaboration Updates",
                              description:
                                "Notifications when shared items are updated",
                            },
                          ].map((setting) => (
                            <div
                              key={setting.id}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {setting.label}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {setting.description}
                                </p>
                              </div>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  defaultChecked={true}
                                  className="sr-only"
                                />
                                <div className="block bg-green-500 w-14 h-8 rounded-full"></div>
                                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform translate-x-6"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Privacy Settings */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className="text-xl mr-2">🔒</span>
                          Privacy & Security
                        </h3>
                        <div className="space-y-4">
                          {[
                            {
                              id: "profile_visibility",
                              label: "Profile Visibility",
                              description:
                                "Make your profile visible to other users",
                            },
                            {
                              id: "activity_status",
                              label: "Show Activity Status",
                              description:
                                "Let others see when you were last active",
                            },
                            {
                              id: "analytics",
                              label: "Usage Analytics",
                              description:
                                "Help improve the app by sharing anonymous usage data",
                            },
                          ].map((setting) => (
                            <div
                              key={setting.id}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {setting.label}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {setting.description}
                                </p>
                              </div>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  defaultChecked={
                                    setting.id !== "profile_visibility"
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`block w-14 h-8 rounded-full ${
                                    setting.id !== "profile_visibility"
                                      ? "bg-green-500"
                                      : "bg-gray-300 dark:bg-gray-600"
                                  }`}
                                ></div>
                                <div
                                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                                    setting.id !== "profile_visibility"
                                      ? "translate-x-6"
                                      : ""
                                  }`}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Account Management
                    </h2>

                    <div className="space-y-6">
                      {/* Account Info */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className="text-xl mr-2">📊</span>
                          Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Account Created
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Last Login
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {user?.lastLogin
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Account Status
                            </label>
                            <p className="text-green-600 dark:text-green-400 capitalize">
                              {user?.status || "Active"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              User ID
                            </label>
                            <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                              {user?.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data Export */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className="text-xl mr-2">📥</span>
                          Export Your Data
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Download a complete copy of all your data including
                          tasks, boards, calendar events, notes, and more.
                        </p>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
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
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Export Data</span>
                        </button>
                      </div>

                      {/* Danger Zone */}
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                        <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4 flex items-center">
                          <span className="text-xl mr-2">⚠️</span>
                          Danger Zone
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-900 dark:text-red-100 font-medium">
                                Deactivate Account
                              </p>
                              <p className="text-red-700 dark:text-red-300 text-sm">
                                Temporarily disable your account
                              </p>
                            </div>
                            <button className="border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg font-medium transition-colors">
                              Deactivate
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-900 dark:text-red-100 font-medium">
                                Delete Account
                              </p>
                              <p className="text-red-700 dark:text-red-300 text-sm">
                                Permanently delete your account and all data
                              </p>
                            </div>
                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
