"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  TooltipProps,
} from "recharts";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { useUIStore } from "@/lib/stores/uiStore";

interface AnalyticsData {
  tasksCompleted: Array<{ date: string; count: number; goal: number }>;
  focusMinutes: Array<{ date: string; minutes: number; sessions: number }>;
  productivityScore: Array<{ date: string; score: number; trend: string }>;
  boardsActivity: Array<{
    name: string;
    tasks: number;
    completed: number;
    active: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  weeklyComparison: {
    thisWeek: { tasks: number; focus: number; score: number };
    lastWeek: { tasks: number; focus: number; score: number };
  };
  streakData: Array<{
    type: string;
    current: number;
    longest: number;
    color: string;
  }>;
  hourlyActivity: Array<{ hour: number; tasks: number; focus: number }>;
  monthlyTrends: Array<{
    month: string;
    tasks: number;
    focus: number;
    productivity: number;
  }>;
}

const AdvancedAnalyticsDashboard = () => {
  const { fetchInsights, overviewLoading } = useDashboardStore();
  const { addNotification } = useUIStore();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "productivity" | "focus" | "tasks" | "insights"
  >("overview");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const loadAnalyticsData = React.useCallback(async () => {
    // Move generateAnalyticsData inside this callback to avoid dependency issues
    const generateAnalyticsData = (): AnalyticsData => {
      const days =
        selectedPeriod === "week"
          ? 7
          : selectedPeriod === "month"
          ? 30
          : selectedPeriod === "quarter"
          ? 90
          : 365;
      const now = new Date();

      // Generate task completion data
      const tasksCompleted = Array.from({ length: days }, (_, i) => {
        const date = new Date(
          now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000
        );
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          count: Math.floor(Math.random() * 12) + 2,
          goal: 8,
        };
      });

      // Generate focus time data
      const focusMinutes = Array.from({ length: days }, (_, i) => {
        const date = new Date(
          now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000
        );
        const sessions = Math.floor(Math.random() * 6) + 1;
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          minutes: sessions * 25 + Math.floor(Math.random() * 30),
          sessions,
        };
      });

      // Generate productivity score
      const productivityScore = Array.from({ length: days }, (_, i) => {
        const date = new Date(
          now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000
        );
        const score = 60 + Math.floor(Math.random() * 35);
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          score,
          trend:
            score > 80
              ? "excellent"
              : score > 65
              ? "good"
              : "needs improvement",
        };
      });

      return {
        tasksCompleted,
        focusMinutes,
        productivityScore,
        boardsActivity: [
          { name: "Work Projects", tasks: 45, completed: 32, active: 13 },
          { name: "Personal Goals", tasks: 28, completed: 22, active: 6 },
          { name: "Learning", tasks: 15, completed: 12, active: 3 },
          { name: "Health & Fitness", tasks: 12, completed: 10, active: 2 },
        ],
        priorityDistribution: [
          { priority: "High", count: 18, percentage: 32 },
          { priority: "Medium", count: 25, percentage: 45 },
          { priority: "Low", count: 13, percentage: 23 },
        ],
        weeklyComparison: {
          thisWeek: { tasks: 34, focus: 420, score: 78 },
          lastWeek: { tasks: 28, focus: 380, score: 72 },
        },
        streakData: [
          { type: "Daily Tasks", current: 7, longest: 15, color: "#10B981" },
          { type: "Focus Sessions", current: 5, longest: 12, color: "#3B82F6" },
          { type: "Calendar Events", current: 3, longest: 8, color: "#8B5CF6" },
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          tasks:
            hour >= 8 && hour <= 18
              ? Math.floor(Math.random() * 8) + 1
              : Math.floor(Math.random() * 3),
          focus:
            hour >= 9 && hour <= 17
              ? Math.floor(Math.random() * 60) + 10
              : Math.floor(Math.random() * 20),
        })),
        monthlyTrends: [
          { month: "Jan", tasks: 120, focus: 1800, productivity: 75 },
          { month: "Feb", tasks: 135, focus: 2100, productivity: 78 },
          { month: "Mar", tasks: 142, focus: 2250, productivity: 82 },
          { month: "Apr", tasks: 128, focus: 1950, productivity: 76 },
          { month: "May", tasks: 156, focus: 2400, productivity: 85 },
          { month: "Jun", tasks: 148, focus: 2200, productivity: 81 },
        ],
      };
    };

    try {
      // Fetch insights and stats
      await fetchInsights(selectedPeriod);

      // Generate analytics data (in a real app, this would come from your API)
      const data = generateAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      addNotification({
        notificationID: `analytics-failed-${Date.now()}`,
        type: "system_announcement",
        title: "Analytics Failed",
        message: "Unable to load analytics data",
        read: false,
        createdAt: new Date().toISOString(),
        userID: "system",
      });
    }
  }, [fetchInsights, selectedPeriod, addNotification]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, loadAnalyticsData]);

  const chartColors = {
    primary: "#10B981",
    secondary: "#3B82F6",
    accent: "#8B5CF6",
    warning: "#F59E0B",
    danger: "#EF4444",
    success: "#10B981",
    info: "#06B6D4",
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-green-100 dark:border-green-800/30">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {Array.isArray(payload) &&
            payload.map((entry, index) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  const StatCard = ({
    title,
    value,
    change,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: string;
    color: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <p
              className={`text-sm mt-1 flex items-center ${
                change.startsWith("+")
                  ? "text-green-600"
                  : change.startsWith("-")
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {change.startsWith("+")
                ? "↗️"
                : change.startsWith("-")
                ? "↘️"
                : "➡️"}{" "}
              {change}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "productivity", label: "Productivity", icon: "⚡" },
    { id: "focus", label: "Focus", icon: "🎯" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "insights", label: "Insights", icon: "💡" },
  ] as const;

  const periods = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "quarter", label: "This Quarter" },
    { id: "year", label: "This Year" },
  ] as const;

  if (overviewLoading || !analyticsData) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 min-h-screen">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Deep insights into your productivity patterns
                  </p>
                </div>
              </div>

              {/* Period Selector */}
              <div className="flex items-center space-x-2">
                {periods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedPeriod === period.id
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6 border-b border-green-100 dark:border-green-800/30">
              <nav className="flex space-x-8">
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
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Tasks Completed"
                  value={analyticsData.weeklyComparison.thisWeek.tasks}
                  change={`+${
                    analyticsData.weeklyComparison.thisWeek.tasks -
                    analyticsData.weeklyComparison.lastWeek.tasks
                  }`}
                  icon="✅"
                  color={chartColors.success}
                />
                <StatCard
                  title="Focus Minutes"
                  value={`${analyticsData.weeklyComparison.thisWeek.focus}m`}
                  change={`+${
                    analyticsData.weeklyComparison.thisWeek.focus -
                    analyticsData.weeklyComparison.lastWeek.focus
                  }m`}
                  icon="⚡"
                  color={chartColors.primary}
                />
                <StatCard
                  title="Productivity Score"
                  value={`${analyticsData.weeklyComparison.thisWeek.score}%`}
                  change={`+${
                    analyticsData.weeklyComparison.thisWeek.score -
                    analyticsData.weeklyComparison.lastWeek.score
                  }%`}
                  icon="📈"
                  color={chartColors.secondary}
                />
                <StatCard
                  title="Active Streaks"
                  value={analyticsData.streakData.length}
                  change="Maintaining"
                  icon="🔥"
                  color={chartColors.warning}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tasks & Focus Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tasks & Focus Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.tasksCompleted.slice(-14)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        fontSize={12}
                      />
                      <YAxis
                        stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        name="Tasks Completed"
                        dot={{
                          fill: chartColors.primary,
                          strokeWidth: 2,
                          r: 4,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="goal"
                        stroke={chartColors.secondary}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Daily Goal"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Task Priority Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.priorityDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ priority, percentage }) =>
                          `${priority} (${percentage}%)`
                        }
                      >
                        <Cell fill={chartColors.danger} />
                        <Cell fill={chartColors.warning} />
                        <Cell fill={chartColors.success} />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Streaks */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Current Streaks 🔥
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analyticsData.streakData.map((streak, index) => (
                    <div key={index} className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            data={[
                              {
                                value: (streak.current / streak.longest) * 100,
                              },
                            ]}
                          >
                            <RadialBar
                              dataKey="value"
                              fill={streak.color}
                              cornerRadius={10}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {streak.current}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {streak.type}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Best: {streak.longest} days
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Productivity Tab */}
          {activeTab === "productivity" && (
            <div className="space-y-8">
              {/* Productivity Score Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Productivity Score Over Time
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analyticsData.productivityScore}>
                    <defs>
                      <linearGradient
                        id="productivityGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColors.primary}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColors.primary}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={chartColors.primary}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#productivityGradient)"
                      name="Productivity Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Activity by Hour of Day
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.hourlyActivity}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="hour"
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="tasks"
                      fill={chartColors.primary}
                      name="Tasks"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="focus"
                      fill={chartColors.secondary}
                      name="Focus (min)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Focus Tab */}
          {activeTab === "focus" && (
            <div className="space-y-8">
              {/* Focus Time Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Focus Time & Sessions
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.focusMinutes}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke={chartColors.primary}
                      strokeWidth={3}
                      name="Focus Minutes"
                      dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke={chartColors.secondary}
                      strokeWidth={3}
                      name="Sessions"
                      dot={{
                        fill: chartColors.secondary,
                        strokeWidth: 2,
                        r: 4,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Focus Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Monthly Focus Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="focus"
                      fill={chartColors.primary}
                      name="Focus Minutes"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-8">
              {/* Boards Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Boards Activity
                </h3>
                <div className="space-y-4">
                  {analyticsData.boardsActivity.map((board, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {board.name}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total: {board.tasks}
                          </span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            Completed: {board.completed}
                          </span>
                          <span className="text-sm text-blue-600 dark:text-blue-400">
                            Active: {board.active}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{
                              width: `${
                                (board.completed / board.tasks) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                          {Math.round((board.completed / board.tasks) * 100)}%
                          complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Completion Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Task Completion vs Goal
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.tasksCompleted.slice(-21)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill={chartColors.primary}
                      name="Completed Tasks"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="goal"
                      fill={chartColors.secondary}
                      name="Daily Goal"
                      radius={[4, 4, 0, 0]}
                      opacity={0.6}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Task Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Monthly Task Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <defs>
                      <linearGradient
                        id="taskGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColors.success}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColors.success}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stroke={chartColors.success}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#taskGradient)"
                      name="Tasks Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === "insights" && (
            <div className="space-y-8">
              {/* AI Insights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🧠</span>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Peak Performance
                    </h3>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 mb-3">
                    Your most productive hours are between 9 AM - 11 AM and 2 PM
                    - 4 PM. Schedule your most important tasks during these
                    windows!
                  </p>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    📈 85% of your high-priority tasks are completed during
                    these times
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Focus Streak
                    </h3>
                  </div>
                  <p className="text-green-800 dark:text-green-200 mb-3">
                    You&apos;re on a 7-day focus session streak! Your average
                    session length has increased by 23% compared to last month.
                  </p>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    🎯 Keep it up! Consistent focus sessions boost productivity
                    by 40%
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      Task Patterns
                    </h3>
                  </div>
                  <p className="text-purple-800 dark:text-purple-200 mb-3">
                    You complete 67% more tasks on Tuesdays and Wednesdays.
                    Consider scheduling important deadlines on these days.
                  </p>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    📅 Monday motivation dip is normal - plan lighter workloads
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🚀</span>
                    </div>
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                      Improvement Opportunity
                    </h3>
                  </div>
                  <p className="text-orange-800 dark:text-orange-200 mb-3">
                    Try breaking large tasks into smaller steps. Tasks with 3-5
                    subtasks have an 89% completion rate vs 61% for single large
                    tasks.
                  </p>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    ✨ Small wins lead to big victories!
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="text-2xl mr-3">💡</span>
                  Personalized Recommendations
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      title: "Optimize Your Schedule",
                      description:
                        "Move high-priority tasks to your peak performance hours (9-11 AM)",
                      impact: "High",
                      color: "green",
                    },
                    {
                      title: "Extend Focus Sessions",
                      description:
                        "Try 45-minute focus blocks instead of 25-minute ones for deep work",
                      impact: "Medium",
                      color: "blue",
                    },
                    {
                      title: "Plan Buffer Time",
                      description:
                        "Add 15-minute buffers between meetings to process and transition",
                      impact: "Medium",
                      color: "purple",
                    },
                    {
                      title: "Weekly Review Ritual",
                      description:
                        "Set aside 30 minutes every Friday to review and plan next week",
                      impact: "High",
                      color: "orange",
                    },
                  ].map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div
                        className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          rec.color === "green"
                            ? "bg-green-500"
                            : rec.color === "blue"
                            ? "bg-blue-500"
                            : rec.color === "purple"
                            ? "bg-purple-500"
                            : "bg-orange-500"
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rec.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {rec.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.impact === "High"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}
                      >
                        {rec.impact} Impact
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievement Badges */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="text-2xl mr-3">🏆</span>
                  Recent Achievements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      icon: "🔥",
                      title: "Week Warrior",
                      desc: "7-day streak",
                      unlocked: true,
                    },
                    {
                      icon: "⚡",
                      title: "Focus Master",
                      desc: "10+ hour focus",
                      unlocked: true,
                    },
                    {
                      icon: "✅",
                      title: "Task Crusher",
                      desc: "50 tasks done",
                      unlocked: true,
                    },
                    {
                      icon: "🎯",
                      title: "Goal Getter",
                      desc: "Monthly target",
                      unlocked: false,
                    },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className={`text-center p-4 rounded-lg border-2 transition-all ${
                        badge.unlocked
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-60"
                      }`}
                    >
                      <div
                        className={`text-3xl mb-2 ${
                          badge.unlocked ? "" : "grayscale"
                        }`}
                      >
                        {badge.icon}
                      </div>
                      <h4
                        className={`font-medium text-sm ${
                          badge.unlocked
                            ? "text-green-800 dark:text-green-200"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {badge.title}
                      </h4>
                      <p
                        className={`text-xs mt-1 ${
                          badge.unlocked
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        {badge.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
