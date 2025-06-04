import { FocusSession, StartFocusRequest, FocusStats, FocusTodaySummary, ApiError } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface FocusState {
    // Data
    sessions: FocusSession[];
    activeSession: FocusSession | null;
    stats: FocusStats | null;
    todaySummary: FocusTodaySummary | null;

    // Timer state
    isRunning: boolean;
    currentDuration: number;
    timerInterval: NodeJS.Timeout | null;

    // Loading states
    loading: boolean;
    startLoading: boolean;
    endLoading: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchSessions: () => Promise<void>;
    fetchActiveSession: () => Promise<void>;
    fetchStats: (period?: string) => Promise<void>;
    fetchTodaySummary: () => Promise<void>;
    startSession: (data?: StartFocusRequest) => Promise<boolean>;
    endSession: (completed?: boolean) => Promise<boolean>;
    pauseSession: () => void;
    resumeSession: () => void;
    updateTimer: () => void;
    clearError: () => void;
}

export const useFocusStore = create<FocusState>()(
    devtools(
        immer((set, get) => ({
            // Initial state
            sessions: [],
            activeSession: null,
            stats: null,
            todaySummary: null,
            isRunning: false,
            currentDuration: 0,
            timerInterval: null,
            loading: false,
            startLoading: false,
            endLoading: false,
            error: null,

            fetchSessions: async () => {
                set((state) => { state.loading = true; state.error = null; });
                try {
                    const response = await apiClient.getFocusSessions();
                    set((state) => {
                        state.sessions = response.sessions || [];
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

            fetchActiveSession: async () => {
                try {
                    const response = await apiClient.getActiveFocusSession();
                    console.log('Active session response:', response);

                    const activeSession = response || null;

                    set((state) => {
                        state.activeSession = activeSession;
                        if (activeSession) {
                            state.isRunning = true;
                            state.currentDuration = activeSession.currentDurationMinutes
                                ? activeSession.currentDurationMinutes * 60
                                : 0;

                            // Start timer if session is active
                            if (!state.timerInterval) {
                                state.timerInterval = setInterval(() => {
                                    get().updateTimer();
                                }, 1000);
                            }
                        } else {
                            state.isRunning = false;
                            state.currentDuration = 0;
                            if (state.timerInterval) {
                                clearInterval(state.timerInterval);
                                state.timerInterval = null;
                            }
                        }
                    });
                } catch (error) {
                    console.warn('Failed to fetch active session:', error);
                }
            },

            fetchStats: async (period) => {
                try {
                    const response = await apiClient.getFocusStats(period);
                    // FIXED: Handle the response structure properly
                    set((state) => {
                        state.stats = response || response || null;
                    });
                } catch (error) {
                    console.warn('Failed to fetch focus stats:', error);
                }
            },

            fetchTodaySummary: async () => {
                try {
                    const response = await apiClient.getFocusToday();
                    // FIXED: Handle the response structure properly
                    set((state) => {
                        state.todaySummary = response || response || null;
                    });
                } catch (error) {
                    console.warn('Failed to fetch today summary:', error);
                }
            },

            startSession: async (data) => {
                set((state) => { state.startLoading = true; state.error = null; });
                try {
                    console.log('Starting session with data:', data);
                    const response = await apiClient.startFocusSession(data);
                    console.log('Start session response:', response);

                    if (response) {
                        const session = response;

                        set((state) => {
                            state.activeSession = session;
                            state.isRunning = true;
                            state.currentDuration = 0;
                            state.startLoading = false;

                            // Start timer
                            if (state.timerInterval) clearInterval(state.timerInterval);
                            state.timerInterval = setInterval(() => {
                                get().updateTimer();
                            }, 1000);
                        });

                        const duration = data?.durationMinutes || 25;
                        toast.success(`Focus session started! 🎯 Stay focused for ${duration} minutes!`);
                        get().fetchTodaySummary();
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    console.error('Start session error:', apiError);
                    set((state) => {
                        state.startLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to start focus session!');
                    return false;
                }
            },

            endSession: async (completed = true) => {
                const { activeSession } = get();
                if (!activeSession) return false;

                set((state) => { state.endLoading = true; state.error = null; });
                try {
                    const response = await apiClient.endFocusSession(activeSession.id, { completed });

                    set((state) => {
                        if (state.timerInterval) {
                            clearInterval(state.timerInterval);
                            state.timerInterval = null;
                        }

                        state.activeSession = null;
                        state.isRunning = false;
                        state.currentDuration = 0;
                        state.endLoading = false;

                        const session = response;
                        if (session) {
                            state.sessions.unshift(session);
                        }
                    });

                    const minutes = Math.floor(get().currentDuration / 60);
                    const message = completed
                        ? `Focus session completed! Great job! 🎉 You focused for ${minutes} minutes!`
                        : 'Focus session ended. ⏸️';
                    toast.success(message);
                    get().fetchStats();
                    get().fetchTodaySummary();

                    return true;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.endLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to end focus session!');
                    return false;
                }
            },

            pauseSession: () => {
                set((state) => {
                    if (state.timerInterval) {
                        clearInterval(state.timerInterval);
                        state.timerInterval = null;
                    }
                    state.isRunning = false;
                });
                toast('Focus session paused ⏸️');
            },

            resumeSession: () => {
                set((state) => {
                    if (!state.timerInterval) {
                        state.timerInterval = setInterval(() => {
                            get().updateTimer();
                        }, 1000);
                    }
                    state.isRunning = true;
                });
                toast('Focus session resumed ▶️');
            },

            updateTimer: () => {
                set((state) => {
                    if (state.isRunning) {
                        state.currentDuration += 1;
                    }
                });
            },

            clearError: () => set((state) => { state.error = null; }),
        })),
        { name: 'FocusStore' }
    )
);