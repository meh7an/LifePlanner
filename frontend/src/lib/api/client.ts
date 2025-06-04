// =============================================================================
// 🚀 LIFE PLANNER - TYPE-SAFE API CLIENT
// =============================================================================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
    ApiResponse,
    ApiError,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    User,
    UserWithStats,
    Board,
    CreateBoardRequest,
    UpdateBoardRequest,
    List,
    CreateListRequest,
    UpdateListRequest,
    Task,
    CreateTaskRequest,
    UpdateTaskRequest,
    TaskStep,
    CreateTaskStepRequest,
    UpdateTaskStepRequest,
    TaskFilters,
    TodayTasksOverview,
    Calendar,
    CreateCalendarRequest,
    UpdateCalendarRequest,
    CalendarEvent,
    CreateEventRequest,
    UpdateEventRequest,
    CalendarFilters,
    CalendarView,
    FocusSession,
    StartFocusRequest,
    EndFocusRequest,
    FocusStats,
    FocusTodaySummary,
    Note,
    CreateNoteRequest,
    UpdateNoteRequest,
    NoteFilters,
    DashboardStats,
    DashboardOverview,
    ProductivityInsights,
    Share,
    CreateShareRequest,
    UpdateShareRequest,
    Notification,
    Post,
    CreatePostRequest,
    UpdatePostRequest,
    Memory,
    Archive,
    CreateMemoryRequest,
    CreateArchiveRequest,
    Repeat,
    CreateRepeatRequest,
    UpdateRepeatRequest,
    View,
    CreateViewRequest,
    UpdateViewRequest,
    UploadedFile,
    QueryParams,
    ViewTemplate,
    PaginatedTasks,
    PaginatedFocusSessions,
    PaginatedCalendarEvents,
    PaginatedNotes,
    PaginatedShares,
    PaginatedNotifications,
    PaginatedPosts,
    PaginatedMemories,
    PaginatedArchives,
    PaginatedRepeats,
    PaginatedViews
} from '@/lib/types';

// =============================================================================
// 🔧 API CLIENT CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
    private client: AxiosInstance;
    private authToken: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
        this.loadTokenFromStorage();
    }

    // =============================================================================
    // 🔐 AUTHENTICATION & TOKEN MANAGEMENT
    // =============================================================================

    private setupInterceptors() {
        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            (config) => {
                if (this.authToken) {
                    config.headers.Authorization = `Bearer ${this.authToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle errors and token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Handle 401 errors (unauthorized)
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = this.getRefreshToken();
                        if (refreshToken) {
                            const response = await this.refreshAuthToken(refreshToken);
                            this.setAuthToken(response.token);
                            this.setRefreshToken(response.refreshToken);

                            // Retry original request with new token
                            originalRequest.headers.Authorization = `Bearer ${response.token}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        this.clearTokens();
                        // Redirect to login or dispatch logout action
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                    }
                }

                return Promise.reject(this.handleApiError(error));
            }
        );
    }

    private handleApiError(error: unknown): ApiError {
        if (axios.isAxiosError(error)) {
            if (error.response?.data) {
                return {
                    error: error.response.data.error || 'API Error',
                    message: error.response.data.message || 'Something went wrong',
                    details: error.response.data.details || [],
                    statusCode: error.response.status,
                };
            }
            return {
                error: 'Network Error',
                message: error.message || 'Failed to connect to server',
                statusCode: error.response?.status || 0,
            };
        }
        return {
            error: 'Unknown Error',
            message: 'An unexpected error occurred',
            statusCode: 500,
        };
    }

    // Token management methods
    setAuthToken(token: string) {
        this.authToken = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    setRefreshToken(refreshToken: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    getRefreshToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('refresh_token');
        }
        return null;
    }

    clearTokens() {
        this.authToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
        }
    }

    private loadTokenFromStorage() {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token) {
                this.authToken = token;
            }
        }
    }

    isAuthenticated(): boolean {
        return !!this.authToken;
    }

    // =============================================================================
    // 🔐 AUTHENTICATION ENDPOINTS
    // =============================================================================

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await this.client.post<AuthResponse>('/auth/register', data);
        return response.data;
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await this.client.post<AuthResponse>('/auth/login', data);
        return response.data;
    }

    async refreshAuthToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
        const response = await this.client.post('/auth/refresh', { refreshToken });
        return response.data;
    }

    async getCurrentUser(): Promise<UserWithStats> {
        const response = await this.client.get<{ message: string, user: UserWithStats }>('/auth/me');
        return response.data.user;
    }

    async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
        const response = await this.client.put<ApiResponse<User>>('/auth/profile', data);
        return response.data;
    }

    async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
        const response = await this.client.put<ApiResponse<void>>('/auth/change-password', data);
        return response.data;
    }

    async logout(): Promise<ApiResponse<void>> {
        const response = await this.client.post<ApiResponse<void>>('/auth/logout');
        this.clearTokens();
        return response.data;
    }

    // =============================================================================
    // 📋 BOARD ENDPOINTS
    // =============================================================================

    async getBoards(includeArchived = false): Promise<{ boards: Board[]; count: number }> {
        const response = await this.client.get<{ boards: Board[]; count: number }>(
            `/boards?includeArchived=${includeArchived}`
        )
        return response.data;
    }

    async getBoard(id: string): Promise<Board> {
        const response = await this.client.get<{ message: string, board: Board }>(`/boards/${id}`);
        return response.data.board;
    }

    async createBoard(data: CreateBoardRequest): Promise<Board> {
        const response = await this.client.post<{ message: string, board: Board }>('/boards', data);
        return response.data.board;
    }

    async updateBoard(id: string, data: UpdateBoardRequest): Promise<Board> {
        const response = await this.client.put<{ message: string, board: Board }>(`/boards/${id}`, data);
        return response.data.board;
    }

    async deleteBoard(id: string, permanent = false): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/boards/${id}?permanent=${permanent}`);
        return response.data;
    }

    async getBoardStats(id: string): Promise<ApiResponse<{ stats: Board['stats'] }>> {
        const response = await this.client.get<ApiResponse<{ stats: Board['stats'] }>>(`/boards/${id}/stats`);
        return response.data;
    }

    // =============================================================================
    // 📝 LIST ENDPOINTS
    // =============================================================================

    async createList(boardId: string, data: CreateListRequest): Promise<List> {
        const response = await this.client.post<List>(`/boards/${boardId}/lists`, data);
        return response.data;
    }

    async updateList(id: string, data: UpdateListRequest): Promise<List> {
        const response = await this.client.put<List>(`/boards/lists/${id}`, data);
        return response.data;
    }

    async deleteList(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/boards/lists/${id}`);
        return response.data;
    }

    // =============================================================================
    // ✅ TASK ENDPOINTS
    // =============================================================================

    async getTasks(params?: TaskFilters & QueryParams): Promise<PaginatedTasks> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedTasks>(
            `/tasks${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getTodayTasks(): Promise<TodayTasksOverview> {
        const response = await this.client.get<TodayTasksOverview>('/tasks/today');
        return response.data;
    }

    async getTask(id: string): Promise<Task> {
        const response = await this.client.get<Task>(`/tasks/${id}`);
        return response.data;
    }

    async createTask(data: CreateTaskRequest): Promise<Task> {
        const response = await this.client.post<{ message: string, task: Task }>('/tasks', data);
        return response.data.task;
    }

    async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
        const response = await this.client.put<{ message: string, task: Task }>(`/tasks/${id}`, data);
        return response.data.task;
    }

    async deleteTask(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/tasks/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📋 TASK STEPS ENDPOINTS
    // =============================================================================

    async createTaskStep(taskId: string, data: CreateTaskStepRequest): Promise<TaskStep> {
        const response = await this.client.post<TaskStep>(`/tasks/${taskId}/steps`, data);
        return response.data;
    }

    async updateTaskStep(id: string, data: UpdateTaskStepRequest): Promise<TaskStep> {
        const response = await this.client.put<TaskStep>(`/tasks/steps/${id}`, data);
        return response.data;
    }

    async deleteTaskStep(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/tasks/steps/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📅 CALENDAR ENDPOINTS
    // =============================================================================

    async getCalendars(): Promise<{ calendars: Calendar[]; count: number }> {
        const response = await this.client.get<{ calendars: Calendar[]; count: number }>('/calendars');
        return response.data;
    }

    async getCalendar(id: string): Promise<Calendar> {
        const response = await this.client.get<Calendar>(`/calendars/${id}`);
        return response.data;
    }

    async createCalendar(data: CreateCalendarRequest): Promise<Calendar> {
        const response = await this.client.post<{ message: string, calendar: Calendar }>('/calendars', data);
        return response.data.calendar;
    }

    async updateCalendar(id: string, data: UpdateCalendarRequest): Promise<Calendar> {
        const response = await this.client.put<Calendar>(`/calendars/${id}`, data);
        return response.data;
    }

    async deleteCalendar(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/calendars/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📅 CALENDAR EVENT ENDPOINTS
    // =============================================================================

    async getAllEvents(params?: CalendarFilters & QueryParams): Promise<PaginatedCalendarEvents> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedCalendarEvents>(
            `/calendars/events/all${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getUpcomingEvents(days = 7): Promise<{ events: CalendarEvent[]; summary: unknown }> {
        const response = await this.client.get<{ events: CalendarEvent[]; summary: unknown }>(
            `/calendars/events/upcoming?days=${days}`
        );
        return response.data;
    }

    async getCalendarView(params: {
        startDate: string;
        endDate: string;
        view?: string;
        calendarId?: string;
    }): Promise<ApiResponse<CalendarView>> {
        const queryString = new URLSearchParams(params).toString();
        const response = await this.client.get<ApiResponse<CalendarView>>(
            `/calendars/events/view?${queryString}`
        );
        return response.data;
    }

    async createEvent(data: CreateEventRequest): Promise<CalendarEvent> {
        const response = await this.client.post<{ message: string, event: CalendarEvent }>('/calendars/events', data);
        return response.data.event;
    }

    async updateEvent(id: string, data: UpdateEventRequest): Promise<CalendarEvent> {
        const response = await this.client.put<{ message: string, event: CalendarEvent }>(`/calendars/events/${id}`, data);
        return response.data.event;
    }

    async deleteEvent(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/calendars/events/${id}`);
        return response.data;
    }

    // =============================================================================
    // ⚡ FOCUS SESSION ENDPOINTS
    // =============================================================================

    async getFocusSessions(params?: QueryParams): Promise<PaginatedFocusSessions> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedFocusSessions>(
            `/focus${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getActiveFocusSession(): Promise<FocusSession | null> {
        const response = await this.client.get<FocusSession | null>('/focus/active');
        return response.data;
    }

    async getFocusStats(period?: string): Promise<FocusStats> {
        const response = await this.client.get<FocusStats>(
            `/focus/stats${period ? `?period=${period}` : ''}`
        );
        return response.data;
    }

    async getFocusToday(): Promise<FocusTodaySummary> {
        const response = await this.client.get<FocusTodaySummary>('/focus/today');
        return response.data;
    }

    async startFocusSession(data?: StartFocusRequest): Promise<FocusSession> {
        const response = await this.client.post<FocusSession>('/focus/start', data || {});
        return response.data;
    }

    async endFocusSession(id: string, data?: EndFocusRequest): Promise<FocusSession> {
        const response = await this.client.put<FocusSession>(`/focus/${id}/end`, data || {});
        return response.data;
    }

    async deleteFocusSession(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/focus/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📝 NOTES ENDPOINTS
    // =============================================================================

    async getNotes(params?: NoteFilters & QueryParams): Promise<PaginatedNotes> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedNotes>(
            `/notes${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getTaskNotes(taskId: string, params?: QueryParams): Promise<PaginatedNotes> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedNotes>(
            `/notes/task/${taskId}${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async createTaskNote(taskId: string, data: CreateNoteRequest): Promise<Note> {
        const response = await this.client.post<Note>(`/notes/task/${taskId}`, data);
        return response.data;
    }

    async updateNote(id: string, data: UpdateNoteRequest): Promise<Note> {
        const response = await this.client.put<Note>(`/notes/${id}`, data);
        return response.data;
    }

    async deleteNote(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/notes/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📊 DASHBOARD ENDPOINTS
    // =============================================================================

    async getDashboardOverview(): Promise<{ stats: DashboardStats }> {
        const response = await this.client.get<{ stats: DashboardStats }>('/dashboard/overview');
        return response.data;
    }

    async getDashboardToday(): Promise<DashboardOverview> {
        const response = await this.client.get<DashboardOverview>('/dashboard/today');
        return response.data;
    }

    async getProductivityInsights(period?: string): Promise<ProductivityInsights> {
        const response = await this.client.get<ProductivityInsights>(
            `/dashboard/insights${period ? `?period=${period}` : ''}`
        );
        return response.data;
    }

    // =============================================================================
    // 🤝 SHARING ENDPOINTS
    // =============================================================================

    async createShare(data: CreateShareRequest): Promise<Share> {
        const response = await this.client.post<Share>('/share', data);
        return response.data;
    }

    async getSharedByMe(params?: QueryParams): Promise<PaginatedShares> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedShares>(
            `/share/by-me${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getSharedWithMe(params?: QueryParams): Promise<PaginatedShares> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedShares>(
            `/share/with-me${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async updateSharePermissions(id: string, data: UpdateShareRequest): Promise<Share> {
        const response = await this.client.put<Share>(`/share/${id}/permissions`, data);
        return response.data;
    }

    async deleteShare(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/share/${id}`);
        return response.data;
    }

    // =============================================================================
    // 🔔 NOTIFICATION ENDPOINTS
    // =============================================================================

    async getNotifications(params?: QueryParams): Promise<PaginatedNotifications> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedNotifications>(
            `/notifications${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async markNotificationAsRead(id: string): Promise<Notification> {
        const response = await this.client.put<Notification>(`/notifications/${id}/read`);
        return response.data;
    }

    async markAllNotificationsAsRead(): Promise<{ count: number }> {
        const response = await this.client.put<{ count: number }>('/notifications/read-all');
        return response.data;
    }

    async deleteNotification(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/notifications/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📝 POSTS ENDPOINTS
    // =============================================================================

    async getPosts(params?: {
        privacySetting?: Post['privacySetting'];
        search?: string;
        tags?: string;
        hasMemory?: boolean;
        hasArchive?: boolean;
        startDate?: string;
        endDate?: string;
    } & QueryParams): Promise<PaginatedPosts> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedPosts>(
            `/posts${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getPost(id: string): Promise<Post> {
        const response = await this.client.get<Post>(`/posts/${id}`);
        return response.data;
    }

    async createPost(data: CreatePostRequest): Promise<Post> {
        const response = await this.client.post<Post>('/posts', data);
        return response.data;
    }

    async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
        const response = await this.client.put<Post>(`/posts/${id}`, data);
        return response.data;
    }

    async deletePost(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/posts/${id}`);
        return response.data;
    }

    async searchPosts(params: {
        q?: string;
        privacySetting?: Post['privacySetting'];
        tags?: string;
        category?: string;
        limit?: number;
    }): Promise<{ query: string; posts: Post[]; count: number }> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<{ query: string; posts: Post[]; count: number }>(
            `/posts/search?${queryString}`
        );
        return response.data;
    }

    async convertPostToMemory(id: string, data?: CreateMemoryRequest): Promise<Memory> {
        const response = await this.client.post<Memory>(`/posts/${id}/memory`, data || {});
        return response.data;
    }

    async archivePost(id: string, data?: CreateArchiveRequest): Promise<Archive> {
        const response = await this.client.post<Archive>(`/posts/${id}/archive`, data || {});
        return response.data;
    }

    // =============================================================================
    // 💾 MEMORIES ENDPOINTS
    // =============================================================================

    async getMemories(params?: {
        tags?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    } & QueryParams): Promise<PaginatedMemories> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedMemories>(
            `/memories${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getMemoryTags(): Promise<{ tags: Array<{ tag: string; count: number }>; totalUniqueTags: number; totalTaggedMemories: number }> {
        const response = await this.client.get<{ tags: Array<{ tag: string; count: number }>; totalUniqueTags: number; totalTaggedMemories: number }>('/memories/tags');
        return response.data;
    }

    async searchMemories(params: {
        q?: string;
        tags?: string;
        limit?: number;
    }): Promise<{ query: string; tags: string; memories: Memory[]; count: number }> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<{ query: string; tags: string; memories: Memory[]; count: number }>(
            `/memories/search?${queryString}`
        );
        return response.data;
    }

    async getMemoriesByTag(tag: string, limit = 20): Promise<{ tag: string; memories: Memory[]; count: number }> {
        const response = await this.client.get<{ tag: string; memories: Memory[]; count: number }>(
            `/memories/tag/${encodeURIComponent(tag)}?limit=${limit}`
        );
        return response.data;
    }

    async getMemory(id: string): Promise<Memory> {
        const response = await this.client.get<Memory>(`/memories/${id}`);
        return response.data;
    }

    async updateMemory(id: string, data: { tags: string[] }): Promise<Memory> {
        const response = await this.client.put<Memory>(`/memories/${id}`, data);
        return response.data;
    }

    async deleteMemory(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/memories/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📦 ARCHIVES ENDPOINTS
    // =============================================================================

    async getArchives(params?: {
        category?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    } & QueryParams): Promise<PaginatedArchives> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedArchives>(
            `/archives${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getArchiveCategories(): Promise<{ categories: Array<{ category: string; count: number }>; totalCategories: number; totalArchivedPosts: number }> {
        const response = await this.client.get<{ categories: Array<{ category: string; count: number }>; totalCategories: number; totalArchivedPosts: number }>('/archives/categories');
        return response.data;
    }

    async searchArchives(params: {
        q?: string;
        category?: string;
        limit?: number;
    }): Promise<{ query: string; category: string; archives: Archive[]; count: number }> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<{ query: string; category: string; archives: Archive[]; count: number }>(
            `/archives/search?${queryString}`
        );
        return response.data;
    }

    async getArchivesByCategory(category: string, limit = 20): Promise<{ category: string; archives: Archive[]; count: number }> {
        const response = await this.client.get<{ category: string; archives: Archive[]; count: number }>(
            `/archives/category/${encodeURIComponent(category)}?limit=${limit}`
        );
        return response.data;
    }

    async getArchive(id: string): Promise<Archive> {
        const response = await this.client.get<Archive>(`/archives/${id}`);
        return response.data;
    }

    async updateArchive(id: string, data: { category: string }): Promise<Archive> {
        const response = await this.client.put<Archive>(`/archives/${id}`, data);
        return response.data;
    }

    async unarchive(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/archives/${id}`);
        return response.data;
    }

    async bulkMoveArchives(data: { sourceCategory: string; targetCategory: string }): Promise<{ updatedCount: number }> {
        const response = await this.client.put<{ updatedCount: number }>('/archives/bulk/move-category', data);
        return response.data;
    }

    // =============================================================================
    // 🔄 REPEAT ENDPOINTS
    // =============================================================================

    async getRepeats(params?: {
        periodType?: Repeat['periodType'];
        active?: boolean;
    } & QueryParams): Promise<PaginatedRepeats> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedRepeats>(
            `/repeats${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getRepeatStats(): Promise<{ stats: unknown }> {
        const response = await this.client.get<{ stats: unknown }>('/repeats/stats');
        return response.data;
    }

    async getUpcomingRepeats(params?: {
        taskId?: string;
        days?: number;
        limit?: number;
    }): Promise<{ occurrences: unknown[]; summary: unknown }> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<{ occurrences: unknown[]; summary: unknown }>(
            `/repeats/upcoming${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async processRepeats(): Promise<{ summary: unknown }> {
        const response = await this.client.post<{ summary: unknown }>('/repeats/process');
        return response.data;
    }

    async getTaskRepeat(taskId: string): Promise<Repeat> {
        const response = await this.client.get<Repeat>(`/repeats/task/${taskId}`);
        return response.data;
    }

    async getRepeat(id: string): Promise<Repeat> {
        const response = await this.client.get<Repeat>(`/repeats/${id}`);
        return response.data;
    }

    async createTaskRepeat(taskId: string, data: CreateRepeatRequest): Promise<Repeat> {
        const response = await this.client.post<Repeat>(`/repeats/task/${taskId}`, data);
        return response.data;
    }

    async updateRepeat(id: string, data: UpdateRepeatRequest): Promise<Repeat> {
        const response = await this.client.put<Repeat>(`/repeats/${id}`, data);
        return response.data;
    }

    async deleteRepeat(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/repeats/${id}`);
        return response.data;
    }

    // =============================================================================
    // 🎨 VIEWS ENDPOINTS
    // =============================================================================

    async getViews(params?: {
        viewType?: View['viewType'];
        defaultOnly?: boolean;
    } & QueryParams): Promise<PaginatedViews> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedViews>(
            `/views${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getViewStats(): Promise<{ stats: unknown }> {
        const response = await this.client.get<{ stats: unknown }>('/views/stats');
        return response.data;
    }

    async getViewTemplates(): Promise<{ templates: ViewTemplate[]; count: number }> {
        const response = await this.client.get<{ templates: ViewTemplate[]; count: number }>('/views/templates');
        return response.data;
    }

    async applyViewTemplate(data: {
        templateId: string;
        name?: string;
        setAsDefault?: boolean;
    }): Promise<View> {
        const response = await this.client.post<View>('/views/apply-template', data);
        return response.data;
    }

    async getView(id: string): Promise<View> {
        const response = await this.client.get<View>(`/views/${id}`);
        return response.data;
    }

    async createView(data: CreateViewRequest): Promise<View> {
        const response = await this.client.post<View>('/views', data);
        return response.data;
    }

    async updateView(id: string, data: UpdateViewRequest): Promise<View> {
        const response = await this.client.put<View>(`/views/${id}`, data);
        return response.data;
    }

    async deleteView(id: string): Promise<void> {
        const response = await this.client.delete<void>(`/views/${id}`);
        return response.data;
    }

    async setViewAsDefault(id: string): Promise<View> {
        const response = await this.client.put<View>(`/views/${id}/default`);
        return response.data;
    }

    async duplicateView(id: string, data?: { name?: string }): Promise<View> {
        const response = await this.client.post<View>(`/views/${id}/duplicate`, data || {});
        return response.data;
    }

    // =============================================================================
    // 📁 FILE UPLOAD ENDPOINTS
    // =============================================================================

    async uploadAvatar(file: File): Promise<{ user: User; file: UploadedFile }> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await this.client.post<{ user: User; file: UploadedFile }>(
            '/upload/avatar',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    async uploadTaskAttachments(taskId: string, files: File[]): Promise<{ files: UploadedFile[]; task: Task }> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('attachments', file);
        });

        const response = await this.client.post<{ files: UploadedFile[]; task: Task }>(
            `/upload/task/${taskId}/attachments`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    // =============================================================================
    // 🔄 GENERIC REQUEST METHOD
    // =============================================================================

    async request<T>(config: AxiosRequestConfig): Promise<T> {
        const response = await this.client.request<T>(config);
        return response.data;
    }
}

// =============================================================================
// 🚀 EXPORT SINGLETON INSTANCE
// =============================================================================

const apiClient = new ApiClient();
export default apiClient;

// Export the class for testing purposes
export { ApiClient };