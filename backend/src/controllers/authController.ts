import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { generateToken, generateRefreshToken, verifyToken } from '../middleware/auth';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                res.status(400).json({
                    error: 'Registration failed',
                    message: 'An account with this email already exists'
                });
                return;
            }

            if (existingUser.username === username) {
                res.status(400).json({
                    error: 'Registration failed',
                    message: 'This username is already taken'
                });
                return;
            }
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                status: 'active',
                lastLogin: new Date()
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                status: true,
                createdAt: true
            }
        });

        // Create default board for the user
        await prisma.board.create({
            data: {
                name: 'My First Board',
                type: 'personal',
                userId: user.id
            }
        });

        // Create default calendar
        await prisma.calendar.create({
            data: {
                name: 'My Calendar',
                userId: user.id
            }
        });

        // Initialize user streaks
        await prisma.streak.create({
            data: {
                streakType: 'daily_tasks',
                userId: user.id
            }
        });

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username
        };

        const token = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        res.status(201).json({
            message: 'Registration successful! Welcome to Life Planner! 🎉',
            user,
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Internal server error'
        });
    }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                username: true,
                email: true,
                passwordHash: true,
                profilePicture: true,
                status: true,
                lastLogin: true,
                createdAt: true
            }
        });

        if (!user) {
            res.status(401).json({
                error: 'Login failed',
                message: 'Invalid email or password'
            });
            return;
        }

        // Check if account is active
        if (user.status !== 'active') {
            res.status(401).json({
                error: 'Login failed',
                message: 'Account is not active. Please contact support.'
            });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            res.status(401).json({
                error: 'Login failed',
                message: 'Invalid email or password'
            });
            return;
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username
        };

        const token = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Remove password hash from response
        const { passwordHash, ...userResponse } = user;

        res.json({
            message: 'Login successful! Welcome back! 👋',
            user: userResponse,
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Internal server error'
        });
    }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({
                error: 'Refresh failed',
                message: 'Refresh token is required'
            });
            return;
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);

        // Check if user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                status: true
            }
        });

        if (!user || user.status !== 'active') {
            res.status(401).json({
                error: 'Refresh failed',
                message: 'Invalid refresh token'
            });
            return;
        }

        // Generate new tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username
        };

        const newToken = generateToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        res.json({
            message: 'Token refreshed successfully',
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error('Refresh token error:', error);

        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            res.status(401).json({
                error: 'Refresh failed',
                message: 'Invalid refresh token'
            });
            return;
        }

        res.status(500).json({
            error: 'Refresh failed',
            message: 'Internal server error'
        });
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        boards: true,
                        tasks: true,
                        calendars: true,
                        focusSessions: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
            return;
        }

        res.json({
            message: 'Profile retrieved successfully',
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Profile retrieval failed',
            message: 'Internal server error'
        });
    }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { username, email, profilePicture } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if username or email is already taken (excluding current user)
        if (username || email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: userId } },
                        {
                            OR: [
                                ...(email ? [{ email }] : []),
                                ...(username ? [{ username }] : [])
                            ]
                        }
                    ]
                }
            });

            if (existingUser) {
                if (existingUser.email === email) {
                    res.status(400).json({
                        error: 'Update failed',
                        message: 'An account with this email already exists'
                    });
                    return;
                }

                if (existingUser.username === username) {
                    res.status(400).json({
                        error: 'Update failed',
                        message: 'This username is already taken'
                    });
                    return;
                }
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(username && { username }),
                ...(email && { email }),
                ...(profilePicture !== undefined && { profilePicture })
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Profile updated successfully! ✨',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Profile update failed',
            message: 'Internal server error'
        });
    }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Get current user with password hash
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                passwordHash: true
            }
        });

        if (!user) {
            res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
            return;
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isCurrentPasswordValid) {
            res.status(400).json({
                error: 'Password change failed',
                message: 'Current password is incorrect'
            });
            return;
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });

        res.json({
            message: 'Password changed successfully! 🔒'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Password change failed',
            message: 'Internal server error'
        });
    }
};

// Logout (client-side token removal, but we can track it)
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // In a more complex setup, you might want to blacklist the token
        // For now, we'll just send a success response
        res.json({
            message: 'Logged out successfully! See you soon! 👋'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'Internal server error'
        });
    }
};