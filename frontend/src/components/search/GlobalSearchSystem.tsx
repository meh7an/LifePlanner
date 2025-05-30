"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/stores/uiStore";
import apiClient from "@/lib/api/client";
import {
  Task,
  Board,
  CalendarEvent,
  Note,
  Post,
  Memory,
  Archive,
} from "@/lib/types";

interface SearchResult {
  id: string;
  type: "task" | "board" | "event" | "note" | "post" | "memory" | "archive";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  url: string;
  icon: string;
  color: string;
  createdAt?: string;
  highlightedTitle?: string;
  highlightedDescription?: string;
}

interface SearchResults {
  tasks: Task[];
  boards: Board[];
  events: CalendarEvent[];
  notes: Note[];
  posts: Post[];
  memories: Memory[];
  archives: Archive[];
  totalCount: number;
}

const GlobalSearchSystem = () => {
  const router = useRouter();
  const { addNotification } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    tasks: [],
    boards: [],
    events: [],
    notes: [],
    posts: [],
    memories: [],
    archives: [],
    totalCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  console.log("Dark mode:", isDarkMode);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSearches = localStorage.getItem("recent_searches");
      const savedHistory = localStorage.getItem("search_history");

      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const flattenResults = useCallback((): SearchResult[] => {
    const flattened: SearchResult[] = [];

    // Add tasks
    results.tasks.forEach((task) => {
      flattened.push({
        id: task.taskID,
        type: "task",
        title: task.taskName,
        description: task.description,
        url: `/dashboard/tasks?task=${task.taskID}`,
        icon: "✅",
        color: "text-blue-500",
        createdAt: task.createdAt,
        metadata: {
          priority: task.priority,
          status: task.status,
          boardName: task.board?.name,
        },
      });
    });

    // Add boards
    results.boards.forEach((board) => {
      flattened.push({
        id: board.boardID,
        type: "board",
        title: board.name,
        description: `${board.type} board`,
        url: `/dashboard/boards/${board.boardID}`,
        icon: "📋",
        color: "text-green-500",
        createdAt: board.createdAt,
        metadata: { type: board.type, tasksCount: board.tasksCount },
      });
    });

    // Add events
    results.events.forEach((event) => {
      flattened.push({
        id: event.eventID,
        type: "event",
        title: `${event.eventType} Event`,
        description: `${new Date(event.startTime).toLocaleDateString()}`,
        url: `/dashboard/calendar?event=${event.eventID}`,
        icon: "📅",
        color: "text-purple-500",
        createdAt: event.createdAt,
        metadata: { eventType: event.eventType, startTime: event.startTime },
      });
    });

    // Add notes
    results.notes.forEach((note) => {
      flattened.push({
        id: note.noteID,
        type: "note",
        title: "Note",
        description:
          note.content.substring(0, 100) +
          (note.content.length > 100 ? "..." : ""),
        url: `/dashboard/tasks?note=${note.noteID}`,
        icon: "📝",
        color: "text-yellow-500",
        createdAt: note.createdAt,
        metadata: { taskId: note.taskID },
      });
    });

    // Add posts
    results.posts.forEach((post) => {
      flattened.push({
        id: post.postID,
        type: "post",
        title: post.title,
        description: post.description,
        url: `/dashboard/posts/${post.postID}`,
        icon: "📄",
        color: "text-indigo-500",
        createdAt: post.createdAt,
        metadata: { privacySetting: post.privacySetting },
      });
    });

    // Add memories
    results.memories.forEach((memory) => {
      flattened.push({
        id: memory.memoryID,
        type: "memory",
        title: memory.post?.title || "Memory",
        description: memory.tags.join(", "),
        url: `/dashboard/memories/${memory.memoryID}`,
        icon: "💾",
        color: "text-pink-500",
        createdAt: memory.createdAt,
        metadata: { tags: memory.tags },
      });
    });

    // Add archives
    results.archives.forEach((archive) => {
      flattened.push({
        id: archive.archiveID,
        type: "archive",
        title: archive.post?.title || "Archived Post",
        description: archive.category,
        url: `/dashboard/archives/${archive.archiveID}`,
        icon: "📦",
        color: "text-gray-500",
        createdAt: archive.archiveDate,
        metadata: { category: archive.category },
      });
    });

    return flattened.sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    );
  }, [results]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults({
          tasks: [],
          boards: [],
          events: [],
          notes: [],
          posts: [],
          memories: [],
          archives: [],
          totalCount: 0,
        });
        return;
      }

      setIsLoading(true);

      try {
        // Perform parallel searches across all endpoints
        const [
          tasksResponse,
          boardsResponse,
          eventsResponse,
          notesResponse,
          postsResponse,
          memoriesResponse,
          archivesResponse,
        ] = await Promise.all([
          apiClient.getTasks({ search: searchQuery, limit: 5 }),
          apiClient.getBoards().then((res) => ({
            data: {
              boards:
                res.data?.boards
                  ?.filter((board) =>
                    board.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, 5) || [],
            },
          })),
          apiClient
            .getAllEvents({
              startDate: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .then((res) => ({
              data: {
                events:
                  res.data?.events
                    ?.filter((event) =>
                      event.eventType
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 5) || [],
              },
            })),
          apiClient.getNotes({ search: searchQuery, limit: 5 }),
          apiClient.searchPosts({ q: searchQuery, limit: 5 }),
          apiClient.searchMemories({ q: searchQuery, limit: 5 }),
          apiClient.searchArchives({ q: searchQuery, limit: 5 }),
        ]);

        const newResults = {
          tasks: tasksResponse.data?.tasks || [],
          boards: boardsResponse.data?.boards || [],
          events: eventsResponse.data?.events || [],
          notes: notesResponse.data?.notes || [],
          posts: postsResponse.data?.posts || [],
          memories: memoriesResponse.data?.memories || [],
          archives: archivesResponse.data?.archives || [],
          totalCount: 0,
        };

        newResults.totalCount = Object.values(newResults)
          .filter((arr) => Array.isArray(arr))
          .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

        setResults(newResults);
        setActiveIndex(0);

        // Save search query
        if (!recentSearches.includes(searchQuery)) {
          const updatedSearches = [searchQuery, ...recentSearches.slice(0, 9)];
          setRecentSearches(updatedSearches);
          localStorage.setItem(
            "recent_searches",
            JSON.stringify(updatedSearches)
          );
        }
      } catch (error) {
        console.error("Search error:", error);
        addNotification({
          notificationID: `system-${Date.now()}`,
          type: "system_announcement",
          title: "Search Failed",
          message: "Unable to perform search. Please try again.",
          read: false,
          createdAt: new Date().toISOString(),
          userID: "system",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [recentSearches, addNotification]
  );

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    },
    [performSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      // Add to search history
      const updatedHistory = [
        result,
        ...searchHistory.filter((h) => h.id !== result.id).slice(0, 19),
      ];
      setSearchHistory(updatedHistory);
      localStorage.setItem("search_history", JSON.stringify(updatedHistory));

      // Navigate to result
      router.push(result.url);
      setIsOpen(false);
      setQuery("");
      setActiveIndex(0);

      addNotification({
        notificationID: `system-${Date.now()}`,
        type: "system_announcement",
        title: "Found it! 🎯",
        message: `Opening ${result.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        userID: "system",
      });
    },
    [searchHistory, router, addNotification]
  );

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
    searchInputRef.current?.focus();
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setRecentSearches([]);
    localStorage.removeItem("search_history");
    localStorage.removeItem("recent_searches");
    addNotification({
      notificationID: `system-${Date.now()}`,
      type: "system_announcement",
      title: "Cleared! 🧹",
      message: "Search history has been cleared.",
      read: false,
      createdAt: new Date().toISOString(),
      userID: "system",
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setActiveIndex(0);
      }

      // Arrow navigation
      if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const allResults = flattenResults();
        if (allResults.length > 0) {
          if (e.key === "ArrowDown") {
            setActiveIndex((prev) => (prev + 1) % allResults.length);
          } else {
            setActiveIndex((prev) =>
              prev === 0 ? allResults.length - 1 : prev - 1
            );
          }
        }
      }

      // Enter to select
      if (isOpen && e.key === "Enter") {
        e.preventDefault();
        const allResults = flattenResults();
        if (allResults[activeIndex]) {
          handleResultClick(allResults[activeIndex]);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, results, flattenResults, handleResultClick]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-gray-500 dark:text-gray-400">
          Search everything...
        </span>
        <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </div>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

            {/* Modal panel */}
            <div
              ref={searchContainerRef}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-green-100 dark:border-green-800/30"
            >
              {/* Search Input */}
              <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="Search tasks, boards, events, notes..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg"
                  autoFocus
                />
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin ml-3" />
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
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

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {query.length < 2 ? (
                  <div className="p-6">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
                          Recent Searches
                          <button
                            onClick={clearSearchHistory}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Clear
                          </button>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.slice(0, 5).map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleRecentSearchClick(search)}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search History */}
                    {searchHistory.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Recent Results
                        </h3>
                        <div className="space-y-2">
                          {searchHistory.slice(0, 5).map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleResultClick(result)}
                              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-lg">{result.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${result.color}`}
                              >
                                {result.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {recentSearches.length === 0 &&
                      searchHistory.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-3">🔍</div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Search Everything
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Find tasks, boards, events, notes, and more across
                            your entire workspace
                          </p>
                          <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
                            Tip: Use{" "}
                            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              ⌘K
                            </kbd>{" "}
                            to open search anytime
                          </div>
                        </div>
                      )}
                  </div>
                ) : results.totalCount > 0 ? (
                  <div className="p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Found {results.totalCount} results for &quot;{query}&quot;
                    </div>
                    <div className="space-y-1">
                      {flattenResults().map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                            index === activeIndex
                              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span className="text-lg">{result.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {highlightText(result.title, query)}
                            </p>
                            {result.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {highlightText(result.description, query)}
                              </p>
                            )}
                            {result.metadata && (
                              <div className="flex items-center space-x-2 mt-1">
                                {typeof result.metadata.priority === "string" &&
                                  result.metadata.priority && (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        result.metadata.priority === "high"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                          : result.metadata.priority ===
                                            "medium"
                                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                      }`}
                                    >
                                      {result.metadata.priority}
                                    </span>
                                  )}
                                {typeof result.metadata.boardName ===
                                  "string" &&
                                  result.metadata.boardName && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      in {result.metadata.boardName}
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${result.color}`}
                          >
                            {result.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : query.length >= 2 && !isLoading ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-3">🤷‍♂️</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">
                        ↑↓
                      </kbd>
                      <span>navigate</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">
                        ↵
                      </kbd>
                      <span>select</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">
                        esc
                      </kbd>
                      <span>close</span>
                    </div>
                  </div>
                  <div>Powered by Life Planner Search</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearchSystem;
