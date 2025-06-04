// =============================================================================
// 🎯 LIFE PLANNER - COMPLETE TYPE DEFINITIONS
// =============================================================================

// =============================================================================
// 🧑 USER & AUTHENTICATION TYPES
// =============================================================================

export interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    status: 'active' | 'inactive' | 'suspended';
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    token: string;
    refreshToken: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
    refreshToken: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface UpdateProfileRequest {
    username?: string;
    email?: string;
    profilePicture?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UserStats {
    boardsCount: number;
    tasksCount: number;
    calendarsCount: number;
    focusSessionsCount: number;
    completedTasksCount: number;
    totalFocusMinutes: number;
}

export interface UserWithStats extends User {
    stats: UserStats;
}

// =============================================================================
// 📋 BOARD & LIST TYPES
// =============================================================================

export interface Board {
    id: string;
    name: string;
    type: 'work' | 'personal' | 'project' | 'other';
    createdAt: string;
    isArchived: boolean;
    userId: string;
    lists?: List[];
    tasksCount?: number;
    completedTasksCount?: number;
    stats?: BoardStats;
}

export interface List {
    id: string;
    name: string;
    orderIndex: number;
    boardId: string;
    tasks?: Task[];
    tasksCount?: number;
}

export interface BoardStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
}

export interface CreateBoardRequest {
    name: string;
    type: Board['type'];
}

export interface UpdateBoardRequest {
    name?: string;
    type?: Board['type'];
    isArchived?: boolean;
}

export interface CreateListRequest {
    name: string;
    orderIndex?: number;
}

export interface UpdateListRequest {
    name?: string;
    orderIndex?: number;
}

// =============================================================================
// ✅ TASK & STEP TYPES
// =============================================================================

export interface Task {
    id: string;
    taskName: string;
    description?: string;
    dueTime?: string;
    completed: boolean;
    newTask: boolean;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'completed' | 'canceled';
    userId: string;
    boardId: string;
    listId?: string;
    createdAt: string;
    updatedAt: string;
    board?: Board;
    list?: List;
    steps?: TaskStep[];
    notes?: Note[];
    repeat?: Repeat;
    events?: CalendarEvent[];
    focusSessions?: FocusSession[];
    stepsCount?: number;
    notesCount?: number;
}

export interface PaginatedTasks extends PaginatedResponse {
    tasks: Task[];
}

export interface TaskStep {
    stepId: string;
    description: string;
    completed: boolean;
    orderIndex: number;
    taskId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskRequest {
    taskName: string;
    description?: string;
    dueTime?: string;
    priority?: Task['priority'];
    boardId: string;
    listId?: string;
}

export interface UpdateTaskRequest {
    taskName?: string;
    description?: string;
    dueTime?: string;
    completed?: boolean;
    priority?: Task['priority'];
    status?: Task['status'];
    listId?: string;
}

export interface CreateTaskStepRequest {
    description: string;
    orderIndex?: number;
}

export interface UpdateTaskStepRequest {
    description?: string;
    completed?: boolean;
    orderIndex?: number;
}

export interface TaskFilters {
    boardId?: string;
    listId?: string;
    completed?: boolean;
    priority?: Task['priority'];
    status?: Task['status'];
    dueDate?: string;
    search?: string;
    [key: string]: unknown;
}

export interface TodayTasksOverview {
    dueTasks: Task[];
    newTasks: Task[];
    completedToday: Task[];
    summary: {
        totalDue: number;
        totalNew: number;
        totalCompleted: number;
        completionRate: number;
    };
}

// =============================================================================
// 📅 CALENDAR & EVENT TYPES
// =============================================================================

export interface Calendar {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    events?: CalendarEvent[];
    eventsCount?: number;
}

export interface CalendarEvent {
    id: string;
    startTime: string;
    endTime: string;
    eventType: 'meeting' | 'task' | 'reminder' | 'personal' | 'work' | 'other';
    alarm?: boolean;
    reminder?: number; // minutes before
    calendarId: string;
    taskId?: string;
    createdAt: string;
    updatedAt: string;
    calendar?: Calendar;
    task?: Task;
}

export interface PaginatedCalendarEvents extends PaginatedResponse {
    events: CalendarEvent[];
}

export interface CreateCalendarRequest {
    name: string;
    startDate?: string;
    endDate?: string;
}

export interface UpdateCalendarRequest {
    name?: string;
    startDate?: string;
    endDate?: string;
}

export interface CreateEventRequest {
    startTime: string;
    endTime: string;
    eventType: CalendarEvent['eventType'];
    alarm?: boolean;
    reminder?: number;
    calendarId: string;
    taskId?: string;
}

export interface UpdateEventRequest {
    startTime?: string;
    endTime?: string;
    eventType?: CalendarEvent['eventType'];
    alarm?: boolean;
    reminder?: number;
    taskId?: string;
}

export interface CalendarFilters {
    calendarId?: string;
    startDate?: string;
    endDate?: string;
    eventType?: CalendarEvent['eventType'];
    withTasks?: boolean;
}

export interface CalendarView {
    view: 'month' | 'week' | 'day' | 'agenda';
    dateRange: {
        start: string;
        end: string;
    };
    events: CalendarEvent[];
    eventsByDate: Record<string, CalendarEvent[]>;
    summary: {
        totalEvents: number;
        upcomingEvents: number;
        todayEvents: number;
    };
}

// =============================================================================
// ⚡ FOCUS SESSION TYPES
// =============================================================================

export interface FocusSession {
    id: string;
    startTime: string;
    endTime?: string;
    durationMinutes: number;
    completed: boolean;
    userId: string;
    taskId?: string;
    createdAt: string;
    updatedAt: string;
    task?: Task;
    isActive?: boolean;
    currentDuration?: number;
}

export interface PaginatedFocusSessions extends PaginatedResponse {
    sessions: FocusSession[];
}

export interface StartFocusRequest {
    taskId?: string;
}

export interface EndFocusRequest {
    completed?: boolean;
}

export interface FocusStats {
    totalSessions: number;
    totalMinutes: number;
    totalHours: number;
    averageSessionLength: number;
    completedSessions: number;
    completionRate: number;
    longestSession: number;
    currentStreak: number;
    longestStreak: number;
    todaySessions: number;
    todayMinutes: number;
    weekSessions: number;
    weekMinutes: number;
    monthSessions: number;
    monthMinutes: number;
}

export interface FocusTodaySummary {
    sessions: FocusSession[];
    totalMinutes: number;
    totalSessions: number;
    activeSession?: FocusSession;
    goalProgress: {
        dailyGoal?: number;
        progress: number;
        percentage: number;
    };
}

// =============================================================================
// 📝 NOTE TYPES
// =============================================================================

export interface Note {
    id: string;
    content: string;
    createdAt: string;
    modifiedAt: string;
    taskId: string;
    task?: Task;
}

export interface PaginatedNotes extends PaginatedResponse {
    notes: Note[];
}

export interface CreateNoteRequest {
    content: string;
}

export interface UpdateNoteRequest {
    content: string;
}

export interface NoteFilters {
    search?: string;
    boardId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
}

export interface NoteStats {
    totalNotes: number;
    weeklyNotes: number;
    monthlyNotes: number;
    topTasksWithNotes: Array<{
        task: Task;
        notesCount: number;
    }>;
}

// =============================================================================
// 📝 POST, MEMORY & ARCHIVE TYPES
// =============================================================================

export interface Post {
    id: string;
    title: string;
    description?: string;
    privacySetting: 'public' | 'private';
    createdAt: string;
    modifiedAt: string;
    userId: string;
    memory?: Memory;
    archive?: Archive;
    hasMemory?: boolean;
    hasArchive?: boolean;
}

export interface PaginatedPosts extends PaginatedResponse {
    posts: Post[];
}

export interface Memory {
    id: string;
    createdAt: string;
    tags: string[];
    postId: string;
    post?: Post;
}

export interface PaginatedMemories extends PaginatedResponse {
    memories: Memory[];
}

export interface Archive {
    id: string;
    archiveDate: string;
    category: string;
    postId: string;
    post?: Post;
}

export interface PaginatedArchives extends PaginatedResponse {
    archives: Archive[];
}

export interface CreatePostRequest {
    title: string;
    description?: string;
    privacySetting?: Post['privacySetting'];
}

export interface UpdatePostRequest {
    title?: string;
    description?: string;
    privacySetting?: Post['privacySetting'];
}

export interface CreateMemoryRequest {
    tags?: string[];
}

export interface CreateArchiveRequest {
    category?: string;
}

export interface UpdateMemoryRequest {
    tags: string[];
}

export interface UpdateArchiveRequest {
    category: string;
}

// =============================================================================
// 🔄 REPEAT & STREAK TYPES
// =============================================================================

export interface Repeat {
    id: string;
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
    periodValue?: number;
    repeatDays?: string[]; // e.g., ['monday', 'wednesday', 'friday']
    endDate?: string;
    infiniteRepeat: boolean;
    taskId: string;
    createdAt: string;
    updatedAt: string;
    task?: Task;
}

export interface PaginatedRepeats extends PaginatedResponse {
    repeats: Repeat[];
}

export interface CreateRepeatRequest {
    periodType: Repeat['periodType'];
    periodValue?: number;
    repeatDays?: string[];
    endDate?: string;
    infiniteRepeat?: boolean;
}

export interface UpdateRepeatRequest {
    periodType?: Repeat['periodType'];
    periodValue?: number;
    repeatDays?: string[];
    endDate?: string;
    infiniteRepeat?: boolean;
}

export interface Streak {
    id: string;
    currentCount: number;
    lastUpdate: string;
    streakType: 'daily_tasks' | 'focus_sessions' | 'calendar_events' | 'custom';
    longestStreak: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// 🎨 VIEW & CUSTOMIZATION TYPES
// =============================================================================

// =============================================================================
// 🎨 VIEW PREFERENCES TYPES
// =============================================================================

export interface DashboardViewPreferences {
    showStats: boolean;
    showUpcoming: boolean;
    showRecentActivity: boolean;
    statsLayout: 'grid' | 'list';
    refreshInterval: number;
}

export interface TasksBoardViewPreferences {
    showCompletedTasks: boolean;
    groupBy: 'list' | 'priority' | 'status';
    cardSize: 'compact' | 'normal' | 'detailed';
    showTaskCounts: boolean;
    autoArchiveCompleted: boolean;
}

export interface TasksListViewPreferences {
    showSubtasks: boolean;
    showNotes: boolean;
    sortBy: 'dueDate' | 'priority' | 'status' | 'created' | 'updated';
    sortOrder: 'asc' | 'desc';
    itemsPerPage: number;
    showFilters: boolean;
}

export interface CalendarMonthViewPreferences {
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    showWeekNumbers: boolean;
    showTasksInCalendar: boolean;
    eventColors: Record<string, string>;
    compactMode: boolean;
}

export interface CalendarWeekViewPreferences {
    hourFormat: '12' | '24';
    startHour: number;
    endHour: number;
    slotDuration: 15 | 30 | 60;
    showAllDayEvents: boolean;
    showWeekends: boolean;
}

export interface FocusModeViewPreferences {
    defaultDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
    showTimer: boolean;
    playNotificationSounds: boolean;
    autoStartBreaks: boolean;
    darkModeInFocus: boolean;
}

export interface AnalyticsViewPreferences {
    defaultPeriod: 'week' | 'month' | 'quarter' | 'year';
    showProductivityTrends: boolean;
    showGoalProgress: boolean;
    showTimeDistribution: boolean;
    chartType: 'line' | 'bar' | 'area';
}

export interface CustomViewPreferences {
    layout: 'single' | 'split' | 'grid';
    components: string[];
    refreshInterval: number;
    filters: Record<string, unknown>;
    customStyles: Record<string, string>;
}

export type ViewPreferences =
    | DashboardViewPreferences
    | TasksBoardViewPreferences
    | TasksListViewPreferences
    | CalendarMonthViewPreferences
    | CalendarWeekViewPreferences
    | FocusModeViewPreferences
    | AnalyticsViewPreferences
    | CustomViewPreferences;

export interface View {
    id: string;
    viewType: 'dashboard' | 'tasks_board' | 'tasks_list' | 'calendar_month' | 'calendar_week' | 'focus_mode' | 'analytics' | 'custom';
    name?: string;
    description?: string;
    defaultStatus: boolean;
    viewPreferences: ViewPreferences;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedViews extends PaginatedResponse {
    views: View[];
}

export interface CreateViewRequest {
    viewType: View['viewType'];
    name: string;
    description?: string;
    defaultStatus?: boolean;
    viewPreferences?: ViewPreferences;
}

export interface UpdateViewRequest {
    name?: string;
    description?: string;
    defaultStatus?: boolean;
    viewPreferences?: ViewPreferences;
}

export interface ViewTemplate {
    templateId: string;
    name: string;
    description: string;
    viewType: View['viewType'];
    defaultPreferences: ViewPreferences;
    category: string;
}

// =============================================================================
// 🤝 SHARING & COLLABORATION TYPES
// =============================================================================

export interface Share {
    id: string;
    resourceType: 'task' | 'board' | 'calendar';
    resourceId: string;
    permissionLevel: 'read' | 'write' | 'admin';
    sharingTimestamp: string;
    ownerUserId: string;
    sharedWithUserId: string;
    ownerUser?: User;
    sharedWithUser?: User;
    resource?: Task | Board | Calendar;
}

export interface PaginatedShares extends PaginatedResponse {
    shares: Share[];
}

export interface CreateShareRequest {
    resourceType: Share['resourceType'];
    resourceId: string;
    sharedWithUserId: string;
    permissionLevel: Share['permissionLevel'];
}

export interface UpdateShareRequest {
    permissionLevel: Share['permissionLevel'];
}

export interface ShareStats {
    totalSharedByMe: number;
    totalSharedWithMe: number;
    byResourceType: Record<Share['resourceType'], number>;
    byPermissionLevel: Record<Share['permissionLevel'], number>;
}

// =============================================================================
// 🔔 NOTIFICATION TYPES
// =============================================================================

// =============================================================================
// 🔔 NOTIFICATION METADATA TYPES
// =============================================================================

export interface TaskDueSoonMetadata {
    taskId: string;
    taskName: string;
    dueTime: string;
    priority: Task['priority'];
    hoursUntilDue: number;
}

export interface TaskOverdueMetadata {
    taskId: string;
    taskName: string;
    dueTime: string;
    priority: Task['priority'];
    hoursOverdue: number;
}

export interface TaskCompletedMetadata {
    taskId: string;
    taskName: string;
    completedAt: string;
    timeTaken?: number;
    celebrationType: 'normal' | 'streak' | 'milestone';
}

export interface CalendarReminderMetadata {
    eventId: string;
    eventType: CalendarEvent['eventType'];
    startTime: string;
    reminderMinutes: number;
}

export interface FocusSessionCompleteMetadata {
    sessionId: string;
    durationMinutes: number;
    taskId?: string;
    taskName?: string;
    streakCount?: number;
}

export interface StreakMilestoneMetadata {
    streakId: string;
    streakType: Streak['streakType'];
    milestoneCount: number;
    previousMilestone: number;
}

export interface ShareReceivedMetadata {
    shareId: string;
    resourceType: Share['resourceType'];
    resourceId: string;
    resourceName: string;
    ownerName: string;
    permissionLevel: Share['permissionLevel'];
}

export interface CollaborationUpdateMetadata {
    resourceType: Share['resourceType'];
    resourceId: string;
    resourceName: string;
    updateType: 'created' | 'updated' | 'completed' | 'deleted';
    updatedBy: string;
    changes: Record<string, { from: unknown; to: unknown }>;
}

export interface SystemAnnouncementMetadata {
    announcementType: 'feature' | 'maintenance' | 'security' | 'general';
    severity: 'info' | 'warning' | 'critical';
    actionRequired: boolean;
    actionUrl?: string;
    dismissible: boolean;
}

export type NotificationMetadata =
    | TaskDueSoonMetadata
    | TaskOverdueMetadata
    | TaskCompletedMetadata
    | CalendarReminderMetadata
    | FocusSessionCompleteMetadata
    | StreakMilestoneMetadata
    | ShareReceivedMetadata
    | CollaborationUpdateMetadata
    | SystemAnnouncementMetadata;

export interface Notification {
    id: string;
    type: 'task_due_soon' | 'task_overdue' | 'task_completed' | 'calendar_reminder' | 'focus_session_complete' | 'streak_milestone' | 'share_received' | 'collaboration_update' | 'system_announcement';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    readAt?: string;
    userId: string;
    relatedResourceType?: string;
    relatedResourceId?: string;
    metadata?: NotificationMetadata;
}

export interface PaginatedNotifications extends PaginatedResponse {
    notifications: Notification[];
}

export interface NotificationStats {
    totalNotifications: number;
    unreadCount: number;
    byType: Record<Notification['type'], number>;
    todayCount: number;
    weekCount: number;
}

// =============================================================================
// 📊 DASHBOARD & ANALYTICS TYPES
// =============================================================================

export interface DashboardStats {
    tasks: {
        total: number;
        completed: number;
        pending: number;
        overdue: number;
        newToday: number;
        completedToday: number;
        completionRate: number;
    };
    focus: {
        totalMinutes: number;
        totalSessions: number;
        todayMinutes: number;
        todaySessions: number;
        averageSessionLength: number;
        longestStreak: number;
        currentStreak: number;
    };
    boards: {
        total: number;
        active: number;
        archived: number;
        averageTasksPerBoard: number;
    };
    calendar: {
        totalEvents: number;
        todayEvents: number;
        upcomingEvents: number;
        overdueEvents: number;
    };
    notes: {
        total: number;
        thisWeek: number;
        thisMonth: number;
    };
    streaks: Streak[];
    productivity: {
        score: number;
        trend: 'up' | 'down' | 'stable';
        weeklyComparison: number;
    };
}

export interface DashboardOverview {
    stats: DashboardStats;
    todayTasks: Task[];
    upcomingEvents: CalendarEvent[];
    activeSession?: FocusSession;
    recentNotes: Note[];
    streaks: Streak[];
    notifications: Notification[];
}

export interface ProductivityInsights {
    patterns: {
        mostProductiveHours: number[];
        mostProductiveDays: string[];
        averageTasksPerDay: number;
        averageFocusTimePerDay: number;
    };
    recommendations: string[];
    achievements: Array<{
        type: string;
        title: string;
        description: string;
        unlockedAt: string;
    }>;
    trends: {
        tasksCompleted: Array<{ date: string; count: number }>;
        focusMinutes: Array<{ date: string; minutes: number }>;
        productivityScore: Array<{ date: string; score: number }>;
    };
}

// =============================================================================
// 📁 FILE UPLOAD TYPES
// =============================================================================

export interface UploadedFile {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    type: 'avatars' | 'attachments' | 'general';
    uploadedAt: string;
    userId: string;
}

export interface UploadStats {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    byType: Record<UploadedFile['type'], {
        count: number;
        size: number;
        sizeFormatted: string;
    }>;
}

// =============================================================================
// 🌐 API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<TData = unknown> {
    message: string;
    data?: TData;
    error?: string;
    details?: string[];
}

export interface PaginatedResponse {
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
        limit: number;
    };
}

export interface ApiError {
    error: string;
    message: string;
    details?: string[];
    statusCode?: number;
}

// =============================================================================
// 🎯 COMMON UTILITY TYPES
// =============================================================================

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
    startDate?: string;
    endDate?: string;
}

export interface SearchParams {
    search?: string;
    q?: string;
}

export type QueryParams = PaginationParams & SortParams & DateRangeParams & SearchParams;

// =============================================================================
// 🎨 UI STATE TYPES
// =============================================================================

export interface LoadingState {
    isLoading: boolean;
    error?: string | null;
}

export interface UIState {
    sidebarOpen: boolean;
    rightPanelOpen: boolean;
    rightPanelContent?: string;
    theme: 'light' | 'dark' | 'system';
    notifications: Notification[];
    modals: {
        taskModal: boolean;
        eventModal: boolean;
        boardModal: boolean;
        profileModal: boolean;
    };
}

export interface FormState<T = Record<string, unknown>> {
    data: T;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isValid: boolean;
}

// =============================================================================
// 🎮 COMPONENT PROP TYPES
// =============================================================================

export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface TaskComponentProps extends BaseComponentProps {
    task: Task;
    onUpdate?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    showDetails?: boolean;
    editable?: boolean;
}

export interface CalendarComponentProps extends BaseComponentProps {
    events: CalendarEvent[];
    selectedDate: Date;
    onDateSelect?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    view: 'month' | 'week' | 'day';
}

export interface DashboardComponentProps extends BaseComponentProps {
    stats: DashboardStats;
    onRefresh?: () => void;
    loading?: boolean;
}

// =============================================================================
// 🔧 UTILITY TYPES FOR TYPE SAFETY
// =============================================================================

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & Record<string, never>;

// =============================================================================
// 🔥 TYPE GUARDS & UTILITIES
// =============================================================================

export const isTask = (obj: unknown): obj is Task => {
    return typeof obj === 'object' && obj !== null &&
        'id' in obj && typeof (obj as Task).id === 'string' &&
        'taskName' in obj && typeof (obj as Task).taskName === 'string';
};

export const isCalendarEvent = (obj: unknown): obj is CalendarEvent => {
    return typeof obj === 'object' && obj !== null &&
        'id' in obj && typeof (obj as CalendarEvent).id === 'string' &&
        'startTime' in obj && typeof (obj as CalendarEvent).startTime === 'string';
};

export const isFocusSession = (obj: unknown): obj is FocusSession => {
    return typeof obj === 'object' && obj !== null &&
        'id' in obj && typeof (obj as FocusSession).id === 'string' &&
        'startTime' in obj && typeof (obj as FocusSession).startTime === 'string';
};

export const isApiError = (obj: unknown): obj is ApiError => {
    return typeof obj === 'object' && obj !== null &&
        'error' in obj && typeof (obj as ApiError).error === 'string' &&
        'message' in obj && typeof (obj as ApiError).message === 'string';
};

// =============================================================================
// 🎯 CONSTANTS FOR TYPE VALUES
// =============================================================================

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'canceled'] as const;
export const BOARD_TYPES = ['work', 'personal', 'project', 'other'] as const;
export const EVENT_TYPES = ['meeting', 'task', 'reminder', 'personal', 'work', 'other'] as const;
export const REPEAT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export const PERMISSION_LEVELS = ['read', 'write', 'admin'] as const;
export const PRIVACY_SETTINGS = ['public', 'private'] as const;
export const VIEW_TYPES = ['dashboard', 'tasks_board', 'tasks_list', 'calendar_month', 'calendar_week', 'focus_mode', 'analytics', 'custom'] as const;
export const CALENDAR_VIEWS = ['month', 'week', 'day', 'agenda'] as const;

// =============================================================================
// 🚀 READY TO BUILD AMAZING THINGS!
// =============================================================================