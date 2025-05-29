// =============================================================================
// 🚀 LIFE PLANNER - TYPE-SAFE API CLIENT
// =============================================================================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
    ApiResponse,
    PaginatedResponse,
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
    ViewTemplate
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

    async getCurrentUser(): Promise<ApiResponse<UserWithStats>> {
        const response = await this.client.get<ApiResponse<UserWithStats>>('/auth/me');
        return response.data;
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

    async getBoards(includeArchived = false): Promise<ApiResponse<{ boards: Board[]; count: number }>> {
        const response = await this.client.get<ApiResponse<{ boards: Board[]; count: number }>>(
            `/boards?includeArchived=${includeArchived}`
        );
        return response.data;
    }

    async getBoard(id: string): Promise<ApiResponse<Board>> {
        const response = await this.client.get<ApiResponse<Board>>(`/boards/${id}`);
        return response.data;
    }

    async createBoard(data: CreateBoardRequest): Promise<ApiResponse<Board>> {
        const response = await this.client.post<ApiResponse<Board>>('/boards', data);
        return response.data;
    }

    async updateBoard(id: string, data: UpdateBoardRequest): Promise<ApiResponse<Board>> {
        const response = await this.client.put<ApiResponse<Board>>(`/boards/${id}`, data);
        return response.data;
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

    async createList(boardId: string, data: CreateListRequest): Promise<ApiResponse<List>> {
        const response = await this.client.post<ApiResponse<List>>(`/boards/${boardId}/lists`, data);
        return response.data;
    }

    async updateList(id: string, data: UpdateListRequest): Promise<ApiResponse<List>> {
        const response = await this.client.put<ApiResponse<List>>(`/boards/lists/${id}`, data);
        return response.data;
    }

    async deleteList(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/boards/lists/${id}`);
        return response.data;
    }

    // =============================================================================
    // ✅ TASK ENDPOINTS
    // =============================================================================

    async getTasks(params?: TaskFilters & QueryParams): Promise<PaginatedResponse<{ tasks: Task[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ tasks: Task[] }>>(
            `/tasks${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getTodayTasks(): Promise<ApiResponse<TodayTasksOverview>> {
        const response = await this.client.get<ApiResponse<TodayTasksOverview>>('/tasks/today');
        return response.data;
    }

    async getTask(id: string): Promise<ApiResponse<Task>> {
        const response = await this.client.get<ApiResponse<Task>>(`/tasks/${id}`);
        return response.data;
    }

    async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
        const response = await this.client.post<ApiResponse<Task>>('/tasks', data);
        return response.data;
    }

    async updateTask(id: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
        const response = await this.client.put<ApiResponse<Task>>(`/tasks/${id}`, data);
        return response.data;
    }

    async deleteTask(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/tasks/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📋 TASK STEPS ENDPOINTS
    // =============================================================================

    async createTaskStep(taskId: string, data: CreateTaskStepRequest): Promise<ApiResponse<TaskStep>> {
        const response = await this.client.post<ApiResponse<TaskStep>>(`/tasks/${taskId}/steps`, data);
        return response.data;
    }

    async updateTaskStep(id: string, data: UpdateTaskStepRequest): Promise<ApiResponse<TaskStep>> {
        const response = await this.client.put<ApiResponse<TaskStep>>(`/tasks/steps/${id}`, data);
        return response.data;
    }

    async deleteTaskStep(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/tasks/steps/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📅 CALENDAR ENDPOINTS
    // =============================================================================

    async getCalendars(): Promise<ApiResponse<{ calendars: Calendar[]; count: number }>> {
        const response = await this.client.get<ApiResponse<{ calendars: Calendar[]; count: number }>>('/calendars');
        return response.data;
    }

    async getCalendar(id: string): Promise<ApiResponse<Calendar>> {
        const response = await this.client.get<ApiResponse<Calendar>>(`/calendars/${id}`);
        return response.data;
    }

    async createCalendar(data: CreateCalendarRequest): Promise<ApiResponse<Calendar>> {
        const response = await this.client.post<ApiResponse<Calendar>>('/calendars', data);
        return response.data;
    }

    async updateCalendar(id: string, data: UpdateCalendarRequest): Promise<ApiResponse<Calendar>> {
        const response = await this.client.put<ApiResponse<Calendar>>(`/calendars/${id}`, data);
        return response.data;
    }

    async deleteCalendar(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/calendars/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📅 CALENDAR EVENT ENDPOINTS
    // =============================================================================

    async getAllEvents(params?: CalendarFilters & QueryParams): Promise<PaginatedResponse<{ events: CalendarEvent[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ events: CalendarEvent[] }>>(
            `/calendars/events/all${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getUpcomingEvents(days = 7): Promise<ApiResponse<{ events: CalendarEvent[]; summary: unknown }>> {
        const response = await this.client.get<ApiResponse<{ events: CalendarEvent[]; summary: unknown }>>(
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

    async createEvent(data: CreateEventRequest): Promise<ApiResponse<CalendarEvent>> {
        const response = await this.client.post<ApiResponse<CalendarEvent>>('/calendars/events', data);
        return response.data;
    }

    async updateEvent(id: string, data: UpdateEventRequest): Promise<ApiResponse<CalendarEvent>> {
        const response = await this.client.put<ApiResponse<CalendarEvent>>(`/calendars/events/${id}`, data);
        return response.data;
    }

    async deleteEvent(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/calendars/events/${id}`);
        return response.data;
    }

    // =============================================================================
    // ⚡ FOCUS SESSION ENDPOINTS
    // =============================================================================

    async getFocusSessions(params?: QueryParams): Promise<PaginatedResponse<{ sessions: FocusSession[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ sessions: FocusSession[] }>>(
            `/focus${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getActiveFocusSession(): Promise<ApiResponse<FocusSession | null>> {
        const response = await this.client.get<ApiResponse<FocusSession | null>>('/focus/active');
        return response.data;
    }

    async getFocusStats(period?: string): Promise<ApiResponse<FocusStats>> {
        const response = await this.client.get<ApiResponse<FocusStats>>(
            `/focus/stats${period ? `?period=${period}` : ''}`
        );
        return response.data;
    }

    async getFocusToday(): Promise<ApiResponse<FocusTodaySummary>> {
        const response = await this.client.get<ApiResponse<FocusTodaySummary>>('/focus/today');
        return response.data;
    }

    async startFocusSession(data?: StartFocusRequest): Promise<ApiResponse<FocusSession>> {
        const response = await this.client.post<ApiResponse<FocusSession>>('/focus/start', data || {});
        return response.data;
    }

    async endFocusSession(id: string, data?: EndFocusRequest): Promise<ApiResponse<FocusSession>> {
        const response = await this.client.put<ApiResponse<FocusSession>>(`/focus/${id}/end`, data || {});
        return response.data;
    }

    async deleteFocusSession(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/focus/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📝 NOTES ENDPOINTS
    // =============================================================================

    async getNotes(params?: NoteFilters & QueryParams): Promise<PaginatedResponse<{ notes: Note[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ notes: Note[] }>>(
            `/notes${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getTaskNotes(taskId: string, params?: QueryParams): Promise<PaginatedResponse<{ notes: Note[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ notes: Note[] }>>(
            `/notes/task/${taskId}${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async createTaskNote(taskId: string, data: CreateNoteRequest): Promise<ApiResponse<Note>> {
        const response = await this.client.post<ApiResponse<Note>>(`/notes/task/${taskId}`, data);
        return response.data;
    }

    async updateNote(id: string, data: UpdateNoteRequest): Promise<ApiResponse<Note>> {
        const response = await this.client.put<ApiResponse<Note>>(`/notes/${id}`, data);
        return response.data;
    }

    async deleteNote(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/notes/${id}`);
        return response.data;
    }

    // =============================================================================
    // 📊 DASHBOARD ENDPOINTS
    // =============================================================================

    async getDashboardOverview(): Promise<ApiResponse<{ stats: DashboardStats }>> {
        const response = await this.client.get<ApiResponse<{ stats: DashboardStats }>>('/dashboard/overview');
        return response.data;
    }

    async getDashboardToday(): Promise<ApiResponse<DashboardOverview>> {
        const response = await this.client.get<ApiResponse<DashboardOverview>>('/dashboard/today');
        return response.data;
    }

    async getProductivityInsights(period?: string): Promise<ApiResponse<ProductivityInsights>> {
        const response = await this.client.get<ApiResponse<ProductivityInsights>>(
            `/dashboard/insights${period ? `?period=${period}` : ''}`
        );
        return response.data;
    }

    // =============================================================================
    // 🤝 SHARING ENDPOINTS
    // =============================================================================

    async createShare(data: CreateShareRequest): Promise<ApiResponse<Share>> {
        const response = await this.client.post<ApiResponse<Share>>('/share', data);
        return response.data;
    }

    async getSharedByMe(params?: QueryParams): Promise<PaginatedResponse<{ shares: Share[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ shares: Share[] }>>(
            `/share/by-me${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getSharedWithMe(params?: QueryParams): Promise<PaginatedResponse<{ shares: Share[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ shares: Share[] }>>(
            `/share/with-me${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async updateSharePermissions(id: string, data: UpdateShareRequest): Promise<ApiResponse<Share>> {
        const response = await this.client.put<ApiResponse<Share>>(`/share/${id}/permissions`, data);
        return response.data;
    }

    async deleteShare(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/share/${id}`);
        return response.data;
    }

    // =============================================================================
    // 🔔 NOTIFICATION ENDPOINTS
    // =============================================================================

    async getNotifications(params?: QueryParams): Promise<PaginatedResponse<{ notifications: Notification[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ notifications: Notification[] }>>(
            `/notifications${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async markNotificationAsRead(id: string): Promise<ApiResponse<Notification>> {
        const response = await this.client.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
        return response.data;
    }

    async markAllNotificationsAsRead(): Promise<ApiResponse<{ count: number }>> {
        const response = await this.client.put<ApiResponse<{ count: number }>>('/notifications/read-all');
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
    } & QueryParams): Promise<PaginatedResponse<{ posts: Post[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ posts: Post[] }>>(
            `/posts${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getPost(id: string): Promise<ApiResponse<Post>> {
        const response = await this.client.get<ApiResponse<Post>>(`/posts/${id}`);
        return response.data;
    }

    async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
        const response = await this.client.post<ApiResponse<Post>>('/posts', data);
        return response.data;
    }

    async updatePost(id: string, data: UpdatePostRequest): Promise<ApiResponse<Post>> {
        const response = await this.client.put<ApiResponse<Post>>(`/posts/${id}`, data);
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
    }): Promise<ApiResponse<{ query: string; posts: Post[]; count: number }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<ApiResponse<{ query: string; posts: Post[]; count: number }>>(
            `/posts/search?${queryString}`
        );
        return response.data;
    }

    async convertPostToMemory(id: string, data?: CreateMemoryRequest): Promise<ApiResponse<Memory>> {
        const response = await this.client.post<ApiResponse<Memory>>(`/posts/${id}/memory`, data || {});
        return response.data;
    }

    async archivePost(id: string, data?: CreateArchiveRequest): Promise<ApiResponse<Archive>> {
        const response = await this.client.post<ApiResponse<Archive>>(`/posts/${id}/archive`, data || {});
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
    } & QueryParams): Promise<PaginatedResponse<{ memories: Memory[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ memories: Memory[] }>>(
            `/memories${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getMemoryTags(): Promise<ApiResponse<{ tags: Array<{ tag: string; count: number }>; totalUniqueTags: number; totalTaggedMemories: number }>> {
        const response = await this.client.get<ApiResponse<{ tags: Array<{ tag: string; count: number }>; totalUniqueTags: number; totalTaggedMemories: number }>>('/memories/tags');
        return response.data;
    }

    async searchMemories(params: {
        q?: string;
        tags?: string;
        limit?: number;
    }): Promise<ApiResponse<{ query: string; tags: string; memories: Memory[]; count: number }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<ApiResponse<{ query: string; tags: string; memories: Memory[]; count: number }>>(
            `/memories/search?${queryString}`
        );
        return response.data;
    }

    async getMemoriesByTag(tag: string, limit = 20): Promise<ApiResponse<{ tag: string; memories: Memory[]; count: number }>> {
        const response = await this.client.get<ApiResponse<{ tag: string; memories: Memory[]; count: number }>>(
            `/memories/tag/${encodeURIComponent(tag)}?limit=${limit}`
        );
        return response.data;
    }

    async getMemory(id: string): Promise<ApiResponse<Memory>> {
        const response = await this.client.get<ApiResponse<Memory>>(`/memories/${id}`);
        return response.data;
    }

    async updateMemory(id: string, data: { tags: string[] }): Promise<ApiResponse<Memory>> {
        const response = await this.client.put<ApiResponse<Memory>>(`/memories/${id}`, data);
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
    } & QueryParams): Promise<PaginatedResponse<{ archives: Archive[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ archives: Archive[] }>>(
            `/archives${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getArchiveCategories(): Promise<ApiResponse<{ categories: Array<{ category: string; count: number }>; totalCategories: number; totalArchivedPosts: number }>> {
        const response = await this.client.get<ApiResponse<{ categories: Array<{ category: string; count: number }>; totalCategories: number; totalArchivedPosts: number }>>('/archives/categories');
        return response.data;
    }

    async searchArchives(params: {
        q?: string;
        category?: string;
        limit?: number;
    }): Promise<ApiResponse<{ query: string; category: string; archives: Archive[]; count: number }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<ApiResponse<{ query: string; category: string; archives: Archive[]; count: number }>>(
            `/archives/search?${queryString}`
        );
        return response.data;
    }

    async getArchivesByCategory(category: string, limit = 20): Promise<ApiResponse<{ category: string; archives: Archive[]; count: number }>> {
        const response = await this.client.get<ApiResponse<{ category: string; archives: Archive[]; count: number }>>(
            `/archives/category/${encodeURIComponent(category)}?limit=${limit}`
        );
        return response.data;
    }

    async getArchive(id: string): Promise<ApiResponse<Archive>> {
        const response = await this.client.get<ApiResponse<Archive>>(`/archives/${id}`);
        return response.data;
    }

    async updateArchive(id: string, data: { category: string }): Promise<ApiResponse<Archive>> {
        const response = await this.client.put<ApiResponse<Archive>>(`/archives/${id}`, data);
        return response.data;
    }

    async unarchive(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/archives/${id}`);
        return response.data;
    }

    async bulkMoveArchives(data: { sourceCategory: string; targetCategory: string }): Promise<ApiResponse<{ updatedCount: number }>> {
        const response = await this.client.put<ApiResponse<{ updatedCount: number }>>('/archives/bulk/move-category', data);
        return response.data;
    }

    // =============================================================================
    // 🔄 REPEAT ENDPOINTS
    // =============================================================================

    async getRepeats(params?: {
        periodType?: Repeat['periodType'];
        active?: boolean;
    } & QueryParams): Promise<PaginatedResponse<{ repeats: Repeat[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ repeats: Repeat[] }>>(
            `/repeats${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getRepeatStats(): Promise<ApiResponse<{ stats: unknown }>> {
        const response = await this.client.get<ApiResponse<{ stats: unknown }>>('/repeats/stats');
        return response.data;
    }

    async getUpcomingRepeats(params?: {
        taskId?: string;
        days?: number;
        limit?: number;
    }): Promise<ApiResponse<{ occurrences: unknown[]; summary: unknown }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<ApiResponse<{ occurrences: unknown[]; summary: unknown }>>(
            `/repeats/upcoming${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async processRepeats(): Promise<ApiResponse<{ summary: unknown }>> {
        const response = await this.client.post<ApiResponse<{ summary: unknown }>>('/repeats/process');
        return response.data;
    }

    async getTaskRepeat(taskId: string): Promise<ApiResponse<Repeat>> {
        const response = await this.client.get<ApiResponse<Repeat>>(`/repeats/task/${taskId}`);
        return response.data;
    }

    async getRepeat(id: string): Promise<ApiResponse<Repeat>> {
        const response = await this.client.get<ApiResponse<Repeat>>(`/repeats/${id}`);
        return response.data;
    }

    async createTaskRepeat(taskId: string, data: CreateRepeatRequest): Promise<ApiResponse<Repeat>> {
        const response = await this.client.post<ApiResponse<Repeat>>(`/repeats/task/${taskId}`, data);
        return response.data;
    }

    async updateRepeat(id: string, data: UpdateRepeatRequest): Promise<ApiResponse<Repeat>> {
        const response = await this.client.put<ApiResponse<Repeat>>(`/repeats/${id}`, data);
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
    } & QueryParams): Promise<PaginatedResponse<{ views: View[] }>> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await this.client.get<PaginatedResponse<{ views: View[] }>>(
            `/views${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    }

    async getViewStats(): Promise<ApiResponse<{ stats: unknown }>> {
        const response = await this.client.get<ApiResponse<{ stats: unknown }>>('/views/stats');
        return response.data;
    }

    async getViewTemplates(): Promise<ApiResponse<{ templates: ViewTemplate[]; count: number }>> {
        const response = await this.client.get<ApiResponse<{ templates: ViewTemplate[]; count: number }>>('/views/templates');
        return response.data;
    }

    async applyViewTemplate(data: {
        templateId: string;
        name?: string;
        setAsDefault?: boolean;
    }): Promise<ApiResponse<View>> {
        const response = await this.client.post<ApiResponse<View>>('/views/apply-template', data);
        return response.data;
    }

    async getView(id: string): Promise<ApiResponse<View>> {
        const response = await this.client.get<ApiResponse<View>>(`/views/${id}`);
        return response.data;
    }

    async createView(data: CreateViewRequest): Promise<ApiResponse<View>> {
        const response = await this.client.post<ApiResponse<View>>('/views', data);
        return response.data;
    }

    async updateView(id: string, data: UpdateViewRequest): Promise<ApiResponse<View>> {
        const response = await this.client.put<ApiResponse<View>>(`/views/${id}`, data);
        return response.data;
    }

    async deleteView(id: string): Promise<ApiResponse<void>> {
        const response = await this.client.delete<ApiResponse<void>>(`/views/${id}`);
        return response.data;
    }

    async setViewAsDefault(id: string): Promise<ApiResponse<View>> {
        const response = await this.client.put<ApiResponse<View>>(`/views/${id}/default`);
        return response.data;
    }

    async duplicateView(id: string, data?: { name?: string }): Promise<ApiResponse<View>> {
        const response = await this.client.post<ApiResponse<View>>(`/views/${id}/duplicate`, data || {});
        return response.data;
    }

    // =============================================================================
    // 📁 FILE UPLOAD ENDPOINTS
    // =============================================================================

    async uploadAvatar(file: File): Promise<ApiResponse<{ user: User; file: UploadedFile }>> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await this.client.post<ApiResponse<{ user: User; file: UploadedFile }>>(
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

    async uploadTaskAttachments(taskId: string, files: File[]): Promise<ApiResponse<{ files: UploadedFile[]; task: Task }>> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('attachments', file);
        });

        const response = await this.client.post<ApiResponse<{ files: UploadedFile[]; task: Task }>>(
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