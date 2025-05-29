import { Notification } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIState {
    // Layout
    sidebarOpen: boolean;
    rightPanelOpen: boolean;
    rightPanelContent: string | null;

    // Theme
    theme: 'light' | 'dark' | 'system';

    // Modals
    modals: {
        taskModal: boolean;
        eventModal: boolean;
        boardModal: boolean;
        profileModal: boolean;
        settingsModal: boolean;
    };

    // Notifications
    notifications: Notification[];

    // Loading overlay
    globalLoading: boolean;
    globalLoadingText: string;

    // Actions
    toggleSidebar: () => void;
    openRightPanel: (content: string) => void;
    closeRightPanel: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    openModal: (modal: keyof UIState['modals']) => void;
    closeModal: (modal: keyof UIState['modals']) => void;
    closeAllModals: () => void;
    addNotification: (notification: Notification) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    setGlobalLoading: (loading: boolean, text?: string) => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        immer((set) => ({
            // Initial state
            sidebarOpen: true,
            rightPanelOpen: false,
            rightPanelContent: null,
            theme: 'system',
            modals: {
                taskModal: false,
                eventModal: false,
                boardModal: false,
                profileModal: false,
                settingsModal: false,
            },
            notifications: [],
            globalLoading: false,
            globalLoadingText: '',

            toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),

            openRightPanel: (content) => set((state) => {
                state.rightPanelOpen = true;
                state.rightPanelContent = content;
            }),

            closeRightPanel: () => set((state) => {
                state.rightPanelOpen = false;
                state.rightPanelContent = null;
            }),

            setTheme: (theme) => set((state) => { state.theme = theme; }),

            openModal: (modal) => set((state) => { state.modals[modal] = true; }),
            closeModal: (modal) => set((state) => { state.modals[modal] = false; }),
            closeAllModals: () => set((state) => {
                Object.keys(state.modals).forEach(key => {
                    state.modals[key as keyof UIState['modals']] = false;
                });
            }),

            addNotification: (notification) => set((state) => {
                state.notifications.unshift(notification);
                // Keep only last 50 notifications
                if (state.notifications.length > 50) {
                    state.notifications = state.notifications.slice(0, 50);
                }
            }),

            removeNotification: (id) => set((state) => {
                state.notifications = state.notifications.filter((n: Notification) => n.notificationID !== id);
            }),

            clearNotifications: () => set((state) => { state.notifications = []; }),

            setGlobalLoading: (loading, text = '') => set((state) => {
                state.globalLoading = loading;
                state.globalLoadingText = text;
            }),
        })),
        { name: 'UIStore' }
    )
);