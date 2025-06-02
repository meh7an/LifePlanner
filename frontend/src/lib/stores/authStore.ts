// =============================================================================
// 🔐 ZUSTAND AUTH STORE - lib/stores/authStore.ts (FIXED VERSION)
// =============================================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import apiClient from '@/lib/api/client';
import {
    UserWithStats,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    ApiError,
} from '@/lib/types';
import toast from 'react-hot-toast';

// =============================================================================
// 🎯 AUTH STORE INTERFACE
// =============================================================================

interface AuthState {
    // User data
    user: UserWithStats | null;
    isAuthenticated: boolean;
    isInitialized: boolean;

    // Token data (now persisted)
    token: string | null;
    refreshToken: string | null;

    // Loading states
    loginLoading: boolean;
    registerLoading: boolean;
    profileLoading: boolean;
    passwordLoading: boolean;
    logoutLoading: boolean;

    // Error states
    loginError: string | null;
    registerError: string | null;
    profileError: string | null;
    passwordError: string | null;

    // Actions
    login: (credentials: LoginRequest) => Promise<boolean>;
    register: (data: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
    changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
    uploadAvatar: (file: File) => Promise<boolean>;

    // Utility actions
    clearErrors: () => void;
    clearAuthData: () => void;
    initializeAuth: () => Promise<void>;
    setTokens: (token: string, refreshToken: string) => void;

    // Getters (computed values)
    hasPermission: (permission: string) => boolean;
    getUserInitials: () => string;
    getDisplayName: () => string;
}

// =============================================================================
// 🏪 ZUSTAND AUTH STORE
// =============================================================================

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            immer<AuthState>((set, get) => ({
                // =============================================================================
                // 📊 INITIAL STATE
                // =============================================================================
                user: null,
                isAuthenticated: false,
                isInitialized: false,
                token: null,
                refreshToken: null,

                loginLoading: false,
                registerLoading: false,
                profileLoading: false,
                passwordLoading: false,
                logoutLoading: false,

                loginError: null,
                registerError: null,
                profileError: null,
                passwordError: null,

                // =============================================================================
                // 🔐 TOKEN MANAGEMENT
                // =============================================================================

                setTokens: (token: string, refreshToken: string) => {
                    set((state) => {
                        state.token = token;
                        state.refreshToken = refreshToken;
                    });

                    // Set tokens in API client
                    apiClient.setAuthToken(token);
                    apiClient.setRefreshToken(refreshToken);
                },

                // =============================================================================
                // 🔐 AUTHENTICATION ACTIONS
                // =============================================================================

                login: async (credentials: LoginRequest): Promise<boolean> => {
                    set((state) => {
                        state.loginLoading = true;
                        state.loginError = null;
                    });

                    try {
                        const response: AuthResponse = await apiClient.login(credentials);

                        // Set tokens using our setter
                        get().setTokens(response.token, response.refreshToken);

                        set((state) => {
                            state.user = response.user as UserWithStats;
                            state.isAuthenticated = true;
                            state.loginLoading = false;
                            state.loginError = null;
                        });

                        // Success notification
                        toast.success(`Welcome back, ${response.user.username}! 🎉`);

                        return true;
                    } catch (error) {
                        const apiError = error as ApiError;
                        set((state) => {
                            state.loginLoading = false;
                            state.loginError = apiError.message || 'Login failed';
                            state.isAuthenticated = false;
                            state.user = null;
                        });

                        toast.error(apiError.message || 'Login failed! Please try again.');
                        return false;
                    }
                },

                register: async (data: RegisterRequest): Promise<boolean> => {
                    set((state) => {
                        state.registerLoading = true;
                        state.registerError = null;
                    });

                    try {
                        const response: AuthResponse = await apiClient.register(data);

                        // Set tokens using our setter
                        get().setTokens(response.token, response.refreshToken);

                        set((state) => {
                            state.user = response.user as UserWithStats;
                            state.isAuthenticated = true;
                            state.registerLoading = false;
                            state.registerError = null;
                        });

                        // Success notification
                        toast.success(`Account created successfully! Welcome ${response.user.username}! 🎉`);

                        return true;
                    } catch (error) {
                        const apiError = error as ApiError;
                        set((state) => {
                            state.registerLoading = false;
                            state.registerError = apiError.message || 'Registration failed';
                            state.isAuthenticated = false;
                            state.user = null;
                        });

                        toast.error(apiError.message || 'Registration failed! Please try again.');
                        return false;
                    }
                },

                logout: async (): Promise<void> => {
                    set((state) => {
                        state.logoutLoading = true;
                    });

                    try {
                        await apiClient.logout();
                    } catch (error) {
                        // Continue with logout even if API call fails
                        console.warn('Logout API call failed:', error);
                    } finally {
                        // Clear all auth data
                        get().clearAuthData();

                        set((state) => {
                            state.logoutLoading = false;
                        });

                        toast.success('Logged out successfully! See you soon! 👋');
                    }
                },

                refreshUser: async (): Promise<void> => {
                    if (!get().isAuthenticated) return;

                    try {
                        const response = await apiClient.getCurrentUser();

                        if (response.data) {
                            set((state) => {
                                state.user = response.data as UserWithStats;
                            });
                        }
                    } catch (error) {
                        console.warn('Failed to refresh user data:', error);
                        // If token is invalid, logout
                        if ((error as ApiError).statusCode === 401) {
                            get().clearAuthData();
                        }
                    }
                },

                updateProfile: async (data: UpdateProfileRequest): Promise<boolean> => {
                    set((state) => {
                        state.profileLoading = true;
                        state.profileError = null;
                    });

                    try {
                        const response = await apiClient.updateProfile(data);

                        if (response.data) {
                            set((state) => {
                                // Update user data while preserving stats
                                if (state.user) {
                                    state.user = { ...state.user, ...response.data };
                                }
                                state.profileLoading = false;
                            });

                            toast.success('Profile updated successfully! ✨');
                            return true;
                        }

                        return false;
                    } catch (error) {
                        const apiError = error as ApiError;
                        set((state) => {
                            state.profileLoading = false;
                            state.profileError = apiError.message || 'Profile update failed';
                        });

                        toast.error(apiError.message || 'Failed to update profile!');
                        return false;
                    }
                },

                changePassword: async (data: ChangePasswordRequest): Promise<boolean> => {
                    set((state) => {
                        state.passwordLoading = true;
                        state.passwordError = null;
                    });

                    try {
                        await apiClient.changePassword(data);

                        set((state) => {
                            state.passwordLoading = false;
                        });

                        toast.success('Password changed successfully! 🔒');
                        return true;
                    } catch (error) {
                        const apiError = error as ApiError;
                        set((state) => {
                            state.passwordLoading = false;
                            state.passwordError = apiError.message || 'Password change failed';
                        });

                        toast.error(apiError.message || 'Failed to change password!');
                        return false;
                    }
                },

                uploadAvatar: async (file: File): Promise<boolean> => {
                    set((state) => {
                        state.profileLoading = true;
                        state.profileError = null;
                    });

                    try {
                        const response = await apiClient.uploadAvatar(file);

                        if (response.data?.user) {
                            set((state) => {
                                // Update user avatar while preserving other data
                                if (state.user && response.data?.user) {
                                    state.user.profilePicture = response.data.user.profilePicture;
                                }
                                state.profileLoading = false;
                            });

                            toast.success('Avatar updated successfully! 📸');
                            return true;
                        }

                        return false;
                    } catch (error) {
                        const apiError = error as ApiError;
                        set((state) => {
                            state.profileLoading = false;
                            state.profileError = apiError.message || 'Avatar upload failed';
                        });

                        toast.error(apiError.message || 'Failed to upload avatar!');
                        return false;
                    }
                },

                // =============================================================================
                // 🛠️ UTILITY ACTIONS
                // =============================================================================

                clearErrors: () => {
                    set((state) => {
                        state.loginError = null;
                        state.registerError = null;
                        state.profileError = null;
                        state.passwordError = null;
                    });
                },

                clearAuthData: () => {
                    // Clear API client tokens
                    apiClient.clearTokens();

                    // Clear store state
                    set((state) => {
                        state.user = null;
                        state.isAuthenticated = false;
                        state.isInitialized = true; // Keep initialized true
                        state.token = null;
                        state.refreshToken = null;
                        state.loginError = null;
                        state.registerError = null;
                        state.profileError = null;
                        state.passwordError = null;
                    });
                },

                initializeAuth: async (): Promise<void> => {
                    const { token, refreshToken } = get();

                    // If no tokens in store, mark as initialized and return
                    if (!token || !refreshToken) {
                        set((state) => {
                            state.isInitialized = true;
                            state.isAuthenticated = false;
                        });
                        return;
                    }

                    // Set tokens in API client from persisted store
                    apiClient.setAuthToken(token);
                    apiClient.setRefreshToken(refreshToken);

                    try {
                        // Try to get user data with persisted token
                        const response = await apiClient.getCurrentUser();

                        if (response.data) {
                            set((state) => {
                                state.user = response.data as UserWithStats;
                                state.isAuthenticated = true;
                                state.isInitialized = true;
                            });

                            console.log('🎉 Authentication restored from storage');
                        } else {
                            // No user data, clear auth
                            get().clearAuthData();
                        }
                    } catch (error) {
                        console.log('❌ Failed to restore authentication:', error);

                        // If 401, token is invalid - clear everything
                        if ((error as ApiError).statusCode === 401) {
                            get().clearAuthData();
                        } else {
                            // Other errors - still mark as initialized but not authenticated
                            set((state) => {
                                state.isInitialized = true;
                                state.isAuthenticated = false;
                            });
                        }
                    }
                },

                // =============================================================================
                // 🧮 COMPUTED VALUES / GETTERS
                // =============================================================================

                hasPermission: (): boolean => {
                    const { user, isAuthenticated } = get();
                    if (!isAuthenticated || !user) return false;

                    // Add your permission logic here
                    // For now, authenticated users have all permissions
                    return true;
                },

                getUserInitials: (): string => {
                    const { user } = get();
                    if (!user) return '';

                    const names = user.username.split(' ');
                    if (names.length >= 2) {
                        return (names[0][0] + names[1][0]).toUpperCase();
                    }
                    return user.username.slice(0, 2).toUpperCase();
                },

                getDisplayName: (): string => {
                    const { user } = get();
                    return user?.username || 'Guest';
                },
            })),
            {
                name: 'auth-store',
                // Persist tokens, user data, and auth status
                partialize: (state) => ({
                    user: state.user,
                    isAuthenticated: state.isAuthenticated,
                    token: state.token,
                    refreshToken: state.refreshToken,
                }),
                // Initialize auth after rehydration from storage
                onRehydrateStorage: () => (state) => {
                    console.log('🔄 Rehydrating auth store...');
                    if (state) {
                        // Initialize auth with a small delay to ensure everything is ready
                        setTimeout(() => {
                            state.initializeAuth();
                        }, 100);
                    }
                },
            }
        ),
        { name: 'AuthStore' }
    )
);

// =============================================================================
// 🪝 CUSTOM HOOKS FOR COMMON USE CASES
// =============================================================================

// Hook for auth status
export const useAuth = () => {
    const {
        user,
        isAuthenticated,
        isInitialized,
        login,
        register,
        logout,
        refreshUser,
    } = useAuthStore();

    return {
        user,
        isAuthenticated,
        isInitialized,
        login,
        register,
        logout,
        refreshUser,
    };
};

// Hook for loading states
export const useAuthLoading = () => {
    const {
        loginLoading,
        registerLoading,
        profileLoading,
        passwordLoading,
        logoutLoading,
    } = useAuthStore();

    return {
        loginLoading,
        registerLoading,
        profileLoading,
        passwordLoading,
        logoutLoading,
        isLoading: loginLoading || registerLoading || profileLoading || passwordLoading || logoutLoading,
    };
};

// Hook for error states
export const useAuthErrors = () => {
    const {
        loginError,
        registerError,
        profileError,
        passwordError,
        clearErrors,
    } = useAuthStore();

    return {
        loginError,
        registerError,
        profileError,
        passwordError,
        clearErrors,
        hasErrors: !!(loginError || registerError || profileError || passwordError),
    };
};

// Hook for profile management
export const useProfile = () => {
    const {
        user,
        updateProfile,
        changePassword,
        uploadAvatar,
        profileLoading,
        passwordLoading,
        profileError,
        passwordError,
        getUserInitials,
        getDisplayName,
    } = useAuthStore();

    return {
        user,
        updateProfile,
        changePassword,
        uploadAvatar,
        profileLoading,
        passwordLoading,
        profileError,
        passwordError,
        getUserInitials,
        getDisplayName,
    };
};

// Hook for user stats
export const useUserStats = () => {
    const user = useAuthStore((state) => state.user);

    return {
        stats: user?.stats || {
            boardsCount: 0,
            tasksCount: 0,
            calendarsCount: 0,
            focusSessionsCount: 0,
            completedTasksCount: 0,
            totalFocusMinutes: 0,
        },
        hasStats: !!user?.stats,
    };
};

// =============================================================================
// 🎯 AUTH STORE SELECTORS (for performance optimization)
// =============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectUserStats = (state: AuthState) => state.user?.stats;
export const selectAuthLoading = (state: AuthState) => ({
    loginLoading: state.loginLoading,
    registerLoading: state.registerLoading,
    profileLoading: state.profileLoading,
    passwordLoading: state.passwordLoading,
    logoutLoading: state.logoutLoading,
});

// =============================================================================
// 🔄 AUTH STORE ACTIONS (for external use)
// =============================================================================

export const authActions = {
    login: (credentials: LoginRequest) => useAuthStore.getState().login(credentials),
    register: (data: RegisterRequest) => useAuthStore.getState().register(data),
    logout: () => useAuthStore.getState().logout(),
    refreshUser: () => useAuthStore.getState().refreshUser(),
    updateProfile: (data: UpdateProfileRequest) => useAuthStore.getState().updateProfile(data),
    changePassword: (data: ChangePasswordRequest) => useAuthStore.getState().changePassword(data),
    clearErrors: () => useAuthStore.getState().clearErrors(),
    clearAuthData: () => useAuthStore.getState().clearAuthData(),
    initializeAuth: () => useAuthStore.getState().initializeAuth(),
};

// =============================================================================
// 🚀 EXPORT DEFAULT
// =============================================================================

export default useAuthStore;