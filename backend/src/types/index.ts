import { Request } from 'express';
// Base Entity Types
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
}

// User Types
export interface User extends BaseEntity {
    username: string;
    email: string;
    passwordHash: string;
    profilePicture?: string;
    status: UserStatus;
    lastLogin?: Date;
}

export interface UserResponse extends Omit<User, 'passwordHash'> {
    _count?: {
        boards: number;
        tasks: number;
        calendars: number;
        focusSessions: number;
    };
}

export interface UserProfile extends Omit<User, 'passwordHash'> { }

export type UserStatus = 'active' | 'inactive' | 'suspended';

// Board Types
export interface Board extends BaseEntity {
    name: string;
    type: string;
    isArchived: boolean;
    userId: string;
}

export interface BoardWithCounts extends Board {
    _count: {
        tasks: number;
        lists: number;
    };
    lists?: ListWithCounts[];
}

export interface BoardStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    highPriorityTasks: number;
    overdueTasks: number;
    completionRate: number;
}

// List Types
export interface List extends BaseEntity {
    name: string;
    orderIndex: number;
    boardId: string;
}

export interface ListWithCounts extends List {
    _count: {
        tasks: number;
    };
    tasks?: TaskWithDetails[];
}

// Task Types
export interface Task extends BaseEntity {
    taskName: string;
    description?: string;
    dueTime?: Date;
    completed: boolean;
    completedAt?: Date | null;
    newTask: boolean;
    priority: TaskPriority;
    status: TaskStatus;
    userId: string;
    boardId: string;
    listId?: string;
}

export interface TaskWithDetails extends Task {
    board: {
        id: string;
        name: string;
        type: string;
    };
    list?: {
        id: string;
        name: string;
    };
    steps?: TaskStep[];
    notes?: Note[];
    repeat?: Repeat;
    events?: CalendarEvent[];
    focusSessions?: FocusSession[];
    _count?: {
        steps: number;
        notes: number;
    };
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'canceled';

// Task Step Types
export interface TaskStep extends BaseEntity {
    description: string;
    completed: boolean;
    orderIndex: number;
    taskId: string;
}

// Calendar Types
export interface Calendar extends BaseEntity {
    name: string;
    startDate?: Date;
    endDate?: Date;
    userId: string;
}

export interface CalendarWithEvents extends Calendar {
    events: CalendarEventWithDetails[];
    _count: {
        events: number;
    };
}

// Calendar Event Types
export interface CalendarEvent extends BaseEntity {
    startTime: Date;
    endTime: Date;
    eventType: string;
    alarm: boolean;
    reminder?: number;
    calendarId: string;
    taskId?: string;
}

export interface CalendarEventWithDetails extends CalendarEvent {
    calendar: {
        id: string;
        name: string;
    };
    task?: {
        id: string;
        taskName: string;
        description?: string;
        priority: TaskPriority;
        completed: boolean;
        status?: TaskStatus;
    };
}

export interface CalendarView {
    view: CalendarViewType;
    dateRange: {
        start: string;
        end: string;
    };
    events: CalendarEventWithDetails[];
    eventsByDate: Record<string, CalendarEventWithDetails[]>;
    summary: {
        totalEvents: number;
        taskEvents: number;
        upcomingAlarms: number;
    };
}

export type CalendarViewType = 'month' | 'week' | 'day';

// Focus Session Types
export interface FocusSession extends BaseEntity {
    startTime: Date;
    endTime?: Date;
    durationMinutes?: number;
    completed: boolean;
    userId: string;
    taskId?: string;
}

export interface FocusSessionWithTask extends FocusSession {
    task?: {
        id: string;
        taskName: string;
        description?: string;
        priority: TaskPriority;
        completed: boolean;
        board: {
            id: string;
            name: string;
            type: string;
        };
    };
    currentDurationMinutes?: number;
}

export interface FocusStats {
    period: FocusPeriod;
    totalSessions: number;
    totalMinutes: number;
    totalHours: number;
    avgDuration: number;
    longestSession?: {
        duration: number;
        date: Date;
        task: string;
    };
    currentStreak: number;
    longestStreak: number;
    sessionsByDate: Record<string, { count: number; totalMinutes: number }>;
    hourlyProductivity: Record<number, number>;
    insights: {
        averageSessionsPerDay: number;
        mostProductiveHour: {
            hour: number;
            minutes: number;
        };
    };
}

export interface FocusSummary {
    sessionsCompleted: number;
    totalMinutes: number;
    totalHours: number;
    activeSession?: FocusSessionWithTask;
    sessions: FocusSessionWithTask[];
    goal: {
        target: number;
        progress: number;
    };
}

export type FocusPeriod = 'week' | 'month' | 'year' | 'all';

// Note Types
export interface Note extends BaseEntity {
    content: string;
    modifiedAt: Date;
    taskId: string;
}

export interface NoteWithTask extends Note {
    task: {
        id: string;
        taskName: string;
        description?: string;
        priority: TaskPriority;
        completed: boolean;
        status: TaskStatus;
        board: {
            id: string;
            name: string;
            type: string;
        };
        list?: {
            id: string;
            name: string;
        };
    };
    highlightedContent?: string;
}

export interface NotesStats {
    totalNotes: number;
    notesThisWeek: number;
    notesThisMonth: number;
    averageNotesPerWeek: number;
    topTasksWithNotes: Array<{
        task: {
            id: string;
            taskName: string;
            board: {
                id: string;
                name: string;
                type: string;
            };
        };
        notesCount: number;
    }>;
    growth: {
        weeklyGrowth: number;
        monthlyGrowth: number;
    };
}

// Post Types
export interface Post extends BaseEntity {
    title: string;
    description?: string;
    privacySetting: PrivacySetting;
    modifiedAt: Date;
    userId: string;
}

export type PrivacySetting = 'public' | 'private';

// Memory Types
export interface Memory extends BaseEntity {
    tags: string[];
    postId: string;
}

// Archive Types
export interface Archive extends BaseEntity {
    archiveDate: Date;
    category: string;
    postId: string;
}

// Repeat Types
export interface Repeat extends BaseEntity {
    periodType: RepeatPeriod;
    periodValue: number;
    repeatDays: string[];
    endDate?: Date;
    infiniteRepeat: boolean;
    taskId: string;
}

export type RepeatPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// View Types
export interface View extends BaseEntity {
    viewType: ViewType;
    name: string;
    description?: string;
    defaultStatus: boolean;
    viewPreferences?: ViewPreferences;
    userId: string;
}

export interface ViewPreferences {
    layout?: 'grid' | 'list' | 'kanban' | 'calendar';
    columns?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
        priority?: string[];
        status?: string[];
        boardId?: string;
        dateRange?: {
            start: string;
            end: string;
        };
    };
    widgets?: Array<{
        id: string;
        type: 'tasks' | 'calendar' | 'focus' | 'notes' | 'stats';
        position: { x: number; y: number; w: number; h: number };
        config?: Record<string, any>;
    }>;
    theme?: {
        colorScheme?: 'light' | 'dark' | 'auto';
        accentColor?: string;
        compact?: boolean;
    };
}

export type ViewType =
    | 'dashboard'
    | 'tasks_board'
    | 'tasks_list'
    | 'calendar_month'
    | 'calendar_week'
    | 'focus_mode'
    | 'analytics'
    | 'custom';

export interface ViewTemplate {
    id: string;
    name: string;
    description: string;
    viewType: ViewType;
    viewPreferences: ViewPreferences;
}

export interface ViewStats {
    overview: {
        totalViews: number;
        defaultViews: number;
        customViews: number;
    };
    breakdown: Record<string, number>;
    mostUsedType: {
        type: string;
        count: number;
    };
}

// Share Types
export interface Share extends BaseEntity {
    resourceType: ShareResourceType;
    resourceId: string;
    permissionLevel: PermissionLevel;
    sharingTimestamp: Date;
    ownerUserId: string;
    sharedWithUserId: string;
}

export type ShareResourceType = 'task' | 'board' | 'calendar';
export type PermissionLevel = 'read' | 'write' | 'admin';

// Streak Types
export interface Streak extends BaseEntity {
    currentCount: number;
    lastUpdate: Date;
    streakType: StreakType;
    longestStreak: number;
    userId: string;
}

export type StreakType = 'daily_tasks' | 'focus_sessions';

// API Response Types
export interface ApiResponse<T = any> {
    message: string;
    data?: T;
    error?: string;
    details?: any;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination: PaginationResponse;
}

// Authentication Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    user: UserResponse;
    token: string;
    refreshToken: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}

// Request Types for Controllers
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
    };
}

// Filter Types
export interface TaskFilters {
    boardId?: string;
    listId?: string;
    completed?: boolean;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    startDate?: string;
    endDate?: string;
}

export interface EventFilters {
    calendarId?: string;
    startDate?: string;
    endDate?: string;
    eventType?: string;
    withTasks?: boolean;
}

export interface FocusFilters {
    taskId?: string;
    completed?: boolean;
    startDate?: string;
    endDate?: string;
}

export interface NoteFilters {
    search?: string;
    boardId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
}

// Dashboard Types
export interface DashboardStats {
    tasks: {
        total: number;
        completed: number;
        pending: number;
        overdue: number;
        dueToday: number;
    };
    focus: {
        todayMinutes: number;
        weeklyMinutes: number;
        currentStreak: number;
        activeSession?: FocusSessionWithTask;
    };
    boards: {
        total: number;
        active: number;
        archived: number;
    };
    calendar: {
        upcomingEvents: number;
        todayEvents: number;
    };
    notes: {
        total: number;
        thisWeek: number;
    };
    streaks: {
        tasks: number;
        focus: number;
    };
}

export interface TodayOverview {
    date: Date;
    tasks: {
        due: TaskWithDetails[];
        new: TaskWithDetails[];
        completed: number;
    };
    events: CalendarEventWithDetails[];
    focusSummary: FocusSummary;
    recentNotes: NoteWithTask[];
}

// Error Types
export interface ApiError {
    error: string;
    message: string;
    details?: any;
    stack?: string;
}

export interface ValidationError {
    field: string;
    message: string;
}

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
    [P in keyof T]?: T[P];
};

// Database Query Types
export interface WhereClause {
    [key: string]: any;
}

export interface OrderByClause {
    [key: string]: 'asc' | 'desc';
}

export interface IncludeClause {
    [key: string]: boolean | IncludeClause;
}

// Export all types for easy importing
export * from './index';