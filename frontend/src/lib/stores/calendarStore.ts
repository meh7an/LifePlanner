import { Calendar, CalendarEvent, CreateCalendarRequest, CreateEventRequest, UpdateEventRequest, CalendarFilters, CalendarView, ApiError } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface CalendarState {
    // Data
    calendars: Calendar[];
    events: CalendarEvent[];
    selectedDate: Date;
    view: 'month' | 'week' | 'day' | 'agenda';
    calendarView: CalendarView | null;

    // Loading states
    calendarsLoading: boolean;
    eventsLoading: boolean;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchCalendars: () => Promise<void>;
    fetchEvents: (params?: CalendarFilters) => Promise<void>;
    fetchCalendarView: (startDate: string, endDate: string, view?: string) => Promise<void>;
    createCalendar: (data: CreateCalendarRequest) => Promise<boolean>;
    createEvent: (data: CreateEventRequest) => Promise<boolean>;
    updateEvent: (id: string, data: UpdateEventRequest) => Promise<boolean>;
    deleteEvent: (id: string) => Promise<boolean>;
    setSelectedDate: (date: Date) => void;
    setView: (view: 'month' | 'week' | 'day' | 'agenda') => void;
    navigateDate: (direction: 'prev' | 'next') => void;
    goToToday: () => void;
    clearError: () => void;
}

export const useCalendarStore = create<CalendarState>()(
    devtools(
        immer((set, get) => ({
            // Initial state
            calendars: [],
            events: [],
            selectedDate: new Date(),
            view: 'month',
            calendarView: null,
            calendarsLoading: false,
            eventsLoading: false,
            createLoading: false,
            updateLoading: false,
            deleteLoading: false,
            error: null,

            fetchCalendars: async () => {
                set((state) => { state.calendarsLoading = true; state.error = null; });
                try {
                    const response = await apiClient.getCalendars();
                    set((state) => {
                        state.calendars = response.calendars || [];
                        state.calendarsLoading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.calendarsLoading = false;
                        state.error = apiError.message;
                    });
                }
            },

            fetchEvents: async (params) => {
                set((state) => { state.eventsLoading = true; state.error = null; });
                try {
                    const response = await apiClient.getAllEvents(params);
                    set((state) => {
                        state.events = response.events || [];
                        state.eventsLoading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.eventsLoading = false;
                        state.error = apiError.message;
                    });
                }
            },

            fetchCalendarView: async (startDate, endDate, view) => {
                try {
                    const response = await apiClient.getCalendarView({ startDate, endDate, view });
                    set((state) => {
                        state.calendarView = response.data || null;
                    });
                } catch (error) {
                    console.warn('Failed to fetch calendar view:', error);
                }
            },

            createCalendar: async (data) => {
                set((state) => { state.createLoading = true; state.error = null; });
                try {
                    const response = await apiClient.createCalendar(data);
                    if (response) {
                        set((state) => {
                            state.calendars.push(response);
                            state.createLoading = false;
                        });
                        toast.success('Calendar created successfully! 📅');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.createLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to create calendar!');
                    return false;
                }
            },

            createEvent: async (data) => {
                set((state) => { state.createLoading = true; state.error = null; });
                try {
                    const response = await apiClient.createEvent(data);
                    if (response) {
                        set((state) => {
                            state.events.push(response);
                            state.createLoading = false;
                        });
                        toast.success('Event created successfully! 🎉');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.createLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to create event!');
                    return false;
                }
            },

            updateEvent: async (id, data) => {
                set((state) => { state.updateLoading = true; state.error = null; });
                try {
                    const response = await apiClient.updateEvent(id, data);
                    if (response) {
                        set((state) => {
                            const index = state.events.findIndex((e: CalendarEvent) => e.id === id);
                            if (index !== -1) {
                                state.events[index] = response;
                            }
                            state.updateLoading = false;
                        });
                        toast.success('Event updated successfully! ✨');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.updateLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to update event!');
                    return false;
                }
            },

            deleteEvent: async (id) => {
                set((state) => { state.deleteLoading = true; state.error = null; });
                try {
                    await apiClient.deleteEvent(id);
                    set((state) => {
                        state.events = state.events.filter((e: CalendarEvent) => e.id !== id);
                        state.deleteLoading = false;
                    });
                    toast.success('Event deleted successfully! 🗑️');
                    return true;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.deleteLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to delete event!');
                    return false;
                }
            },

            setSelectedDate: (date) => set((state) => { state.selectedDate = date; }),
            setView: (view) => set((state) => { state.view = view; }),

            navigateDate: (direction) => {
                const { selectedDate, view } = get();
                const newDate = new Date(selectedDate);

                if (view === 'month') {
                    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                } else if (view === 'week') {
                    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                } else {
                    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                }

                set((state) => { state.selectedDate = newDate; });
            },

            goToToday: () => set((state) => { state.selectedDate = new Date(); }),
            clearError: () => set((state) => { state.error = null; }),
        })),
        { name: 'CalendarStore' }
    )
);