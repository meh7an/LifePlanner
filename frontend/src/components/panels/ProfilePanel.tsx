"use client";

import { useState } from "react";
import {
  Camera,
  Settings,
  BarChart3,
  Target,
  Clock,
  Award,
} from "lucide-react";
import Image from "next/image";

// summy data
const mockUser = {
  userId: "64220115",
  username: "Alex john",
  email: "johnny@example.com",
  fullName: "alex john the third",
  bio: "Computer Engineering student passionate about productivity",
  profilePicture: null,
  joinedDate: "2024-09-15",
  timezone: "UTC+3",
  theme: "dark",
  totalTasks: 127,
  completedTasks: 89,
  totalFocusHours: 45.5,
  currentStreak: 7,
  longestStreak: 23,
  averageSessionLength: 28,
};

export default function ProfilePanel() {
  const [user, setUser] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const completionRate = Math.round(
    (user.completedTasks / user.totalTasks) * 100
  );

  const handleSave = (updatedData: Partial<typeof mockUser>) => {
    setUser({ ...user, ...updatedData });
    setIsEditing(false);
    // the API CALL CAN BE USED HER
  };

  if (isEditing) {
    return (
      <ProfileEditor
        user={user}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition">
            <Camera className="w-3 h-3 text-white" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {user.fullName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{user.username}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-[200px] mx-auto">
            {user.bio}
          </p>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        >
          <Settings className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "stats", label: "Stats", icon: Target },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {user.totalTasks}
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-300">
                Total Tasks
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {completionRate}%
              </div>
              <div className="text-xs text-green-800 dark:text-green-300">
                Completion Rate
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Current Streaks
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Daily Tasks
                </span>
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {user.currentStreak} days 🔥
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Best Streak
                </span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {user.longestStreak} days
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Focus Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Total Focus Time
                </span>
                <span className="text-sm font-medium">
                  {user.totalFocusHours}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Avg Session Length
                </span>
                <span className="text-sm font-medium">
                  {user.averageSessionLength}min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  This Week
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  8.5h
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Task Completion
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  Completed
                </span>
                <span>
                  {user.completedTasks}/{user.totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Account Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Joined</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {new Date(user.joinedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Timezone
                </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {user.timezone}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Theme
                </span>
                <select className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Notifications
                </span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>

          <button className="w-full py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition">
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileEditor({
  user,
  onSave,
  onCancel,
}: {
  user: typeof mockUser;
  onSave: (data: Partial<typeof mockUser>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    bio: user.bio,
    timezone: user.timezone,
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[85vh] pr-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Edit Profile
        </h2>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) =>
              setFormData({ ...formData, timezone: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="UTC-12">UTC-12</option>
            <option value="UTC-8">UTC-8 (PST)</option>
            <option value="UTC-5">UTC-5 (EST)</option>
            <option value="UTC+0">UTC+0 (GMT)</option>
            <option value="UTC+3">UTC+3 (Turkey)</option>
            <option value="UTC+8">UTC+8 (CST)</option>
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
