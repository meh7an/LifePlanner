import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import apiClient from '@/lib/api/client';
import { DashboardStats, DashboardOverview, ProductivityInsights, ApiError } from '@/lib/types';

interface DashboardState {
    // Data
    stats: DashboardStats | null;
    overview: DashboardOverview | null;
    insights: ProductivityInsights | null;

    // Loading states
    statsLoading: boolean;
    overviewLoading: boolean;
    insightsLoading: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchStats: () => Promise<void>;
    fetchOverview: () => Promise<void>;
    fetchInsights: (period?: string) => Promise<void>;
    refreshAll: () => Promise<void>;
    clearError: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    devtools(
        immer((set, get) => ({
            // Initial state
            stats: null,
            overview: null,
            insights: null,
            statsLoading: false,
            overviewLoading: false,
            insightsLoading: false,
            error: null,

            fetchStats: async () => {
                set((state) => { state.statsLoading = true; state.error = null; });
                try {
                    const response = await apiClient.getDashboardOverview();
                    set((state) => {
                        state.stats = response.stats || null;
                        state.statsLoading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.statsLoading = false;
                        state.error = apiError.message;
                    });
                }
            },

            fetchOverview: async () => {
                set((state) => { state.overviewLoading = true; state.error = null; });
                try {
                    const response = await apiClient.getDashboardToday();
                    set((state) => {
                        state.overview = response || null;
                        state.overviewLoading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.overviewLoading = false;
                        state.error = apiError.message;
                    });
                }
            },

            fetchInsights: async (period = 'week') => {
                set((state) => { state.insightsLoading = true; state.error = null; });
                try {
                    const response = await apiClient.getProductivityInsights(period);
                    set((state) => {
                        state.insights = response || null;
                        state.insightsLoading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.insightsLoading = false;
                        state.error = apiError.message;
                    });
                }
            },

            refreshAll: async () => {
                await Promise.all([
                    get().fetchStats(),
                    get().fetchOverview(),
                    get().fetchInsights()
                ]);
            },

            clearError: () => set((state) => { state.error = null; }),
        })),
        { name: 'DashboardStore' }
    )
);
