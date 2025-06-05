"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, Camera } from "lucide-react";
import { useAuth, useProfile } from "@/lib/stores/authStore";
import Image from "next/image";

export const UserProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, getUserInitials, getDisplayName, uploadAvatar } = useProfile();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
      >
        <div className="relative">
          {user?.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={getDisplayName()}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-green-200 dark:border-green-700"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {getUserInitials()}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
            {" "}
          </div>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {getDisplayName()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-100 dark:border-green-800/30 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {user?.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt={getDisplayName()}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {getDisplayName()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                // Open profile modal
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center space-x-3 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>View Profile </span>
            </button>

            <button
              onClick={() => {
                // Open settings modal
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center space-x-3 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings </span>
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-2">
              {" "}
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out </span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
    </div>
  );
};
