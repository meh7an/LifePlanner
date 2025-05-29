import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters, TodayTasksOverview, QueryParams, ApiError } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface TaskState {
    // Data
    tasks: Task[];
    selectedTask: Task | null;
    todayTasks: TodayTasksOverview | null;

    // Filters & pagination
    filters: TaskFilters;
    pagination: { currentPage: number; totalPages: number; totalCount: number; } | null;

    // Loading states
    loading: boolean;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchTasks: (params?: TaskFilters & QueryParams) => Promise<void>;
    fetchTodayTasks: () => Promise<void>;
    fetchTask: (id: string) => Promise<void>;
    createTask: (data: CreateTaskRequest) => Promise<boolean>;
    updateTask: (id: string, data: UpdateTaskRequest) => Promise<boolean>;
    deleteTask: (id: string) => Promise<boolean>;
    toggleTaskComplete: (id: string) => Promise<boolean>;
    setFilters: (filters: Partial<TaskFilters>) => void;
    clearFilters: () => void;
    setSelectedTask: (task: Task | null) => void;
    clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
    devtools(
        immer((set, get) => ({
            // Initial state
            tasks: [],
            selectedTask: null,
            todayTasks: null,
            filters: {},
            pagination: null,
            loading: false,
            createLoading: false,
            updateLoading: false,
            deleteLoading: false,
            error: null,

            fetchTasks: async (params) => {
                set((state) => { state.loading = true; state.error = null; });
                try {
                    const response = await apiClient.getTasks({ ...get().filters, ...params });
                    set((state) => {
                        state.tasks = response.data?.tasks || [];
                        state.pagination = response.pagination || null;
                        state.loading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.loading = false;
                        state.error = apiError.message;
                    });
                }
            },

            fetchTodayTasks: async () => {
                try {
                    const response = await apiClient.getTodayTasks();
                    set((state) => {
                        state.todayTasks = response.data || null;
                    });
                } catch (error) {
                    console.warn('Failed to fetch today tasks:', error);
                }
            },

            fetchTask: async (id) => {
                try {
                    const response = await apiClient.getTask(id);
                    set((state) => {
                        state.selectedTask = response.data || null;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.error = apiError.message;
                    });
                }
            },

            createTask: async (data) => {
                set((state) => { state.createLoading = true; state.error = null; });
                try {
                    const response = await apiClient.createTask(data);
                    if (response.data) {
                        set((state) => {
                            state.tasks.unshift(response.data);
                            state.createLoading = false;
                        });
                        toast.success('Task created successfully! 🎉');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.createLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to create task!');
                    return false;
                }
            },

            updateTask: async (id, data) => {
                set((state) => { state.updateLoading = true; state.error = null; });
                try {
                    const response = await apiClient.updateTask(id, data);
                    if (response.data) {
                        set((state) => {
                            const index = state.tasks.findIndex((t: Task) => t.taskID === id);
                            if (index !== -1) {
                                state.tasks[index] = response.data;
                            }
                            if (state.selectedTask?.taskID === id) {
                                state.selectedTask = response.data;
                            }
                            state.updateLoading = false;
                        });
                        toast.success('Task updated successfully! ✨');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.updateLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to update task!');
                    return false;
                }
            },

            deleteTask: async (id) => {
                set((state) => { state.deleteLoading = true; state.error = null; });
                try {
                    await apiClient.deleteTask(id);
                    set((state) => {
                        state.tasks = state.tasks.filter((t: Task) => t.taskID !== id);
                        if (state.selectedTask?.taskID === id) {
                            state.selectedTask = null;
                        }
                        state.deleteLoading = false;
                    });
                    toast.success('Task deleted successfully! 🗑️');
                    return true;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.deleteLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to delete task!');
                    return false;
                }
            },

            toggleTaskComplete: async (id) => {
                const task = get().tasks.find(t => t.taskID === id);
                if (!task) return false;

                return await get().updateTask(id, { completed: !task.completed });
            },

            setFilters: (filters) => {
                set((state) => {
                    state.filters = { ...state.filters, ...filters };
                });
                get().fetchTasks();
            },

            clearFilters: () => {
                set((state) => { state.filters = {}; });
                get().fetchTasks();
            },

            setSelectedTask: (task) => set((state) => { state.selectedTask = task; }),
            clearError: () => set((state) => { state.error = null; }),
        })),
        { name: 'TaskStore' }
    )
);