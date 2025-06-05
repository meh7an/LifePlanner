import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    FocusPeriod,
    WhereClause
} from '../types';
import { celebrateFocusSession, celebrateStreakMilestone } from './notificationsController';

// Get all focus sessions for authenticated user
export const getFocusSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            taskId,
            completed,
            startDate,
            endDate,
            page = '1',
            limit = '20',
            sortBy = 'startTime',
            sortOrder = 'desc'
        } = req.query as {
            taskId?: string;
            completed?: string;
            startDate?: string;
            endDate?: string;
            page?: string;
            limit?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Build where clause
        const where: WhereClause = { userId };

        if (taskId) where.taskId = taskId;
        if (completed !== undefined) where.completed = completed === 'true';

        // Date range filtering
        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate as string);
            if (endDate) where.startTime.lte = new Date(endDate as string);
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Valid sort fields
        const validSortFields = ['startTime', 'endTime', 'durationMinutes'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'startTime';
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [sessions, totalCount] = await Promise.all([
            prisma.focusSession.findMany({
                where,
                include: {
                    task: {
                        select: {
                            id: true,
                            taskName: true,
                            description: true,
                            priority: true,
                            completed: true,
                            board: {
                                select: { id: true, name: true, type: true }
                            }
                        }
                    }
                },
                orderBy: { [sortField]: sortDirection },
                skip,
                take: limitNum
            }),
            prisma.focusSession.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Focus sessions retrieved successfully',
            sessions,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get focus sessions error:', error);
        res.status(500).json({
            error: 'Failed to retrieve focus sessions',
            message: 'Internal server error'
        });
    }
};

// Get single focus session by ID
export const getFocusSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const session = await prisma.focusSession.findFirst({
            where: {
                id,
                userId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true,
                        status: true,
                        board: {
                            select: { id: true, name: true, type: true }
                        },
                        list: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!session) {
            res.status(404).json({
                error: 'Focus session not found',
                message: 'Focus session not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Focus session retrieved successfully',
            session
        });

    } catch (error) {
        console.error('Get focus session error:', error);
        res.status(500).json({
            error: 'Failed to retrieve focus session',
            message: 'Internal server error'
        });
    }
};

// Start new focus session
export const startFocusSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId, durationMinutes = 25 } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check for stale active sessions (older than 24 hours)
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const staleActiveSessions = await prisma.focusSession.findMany({
            where: {
                userId,
                completed: false,
                endTime: null,
                startTime: {
                    lt: yesterday // Sessions started more than 24 hours ago
                }
            }
        });

        // Auto-cleanup stale sessions
        if (staleActiveSessions.length > 0) {
            console.log(`Cleaning up ${staleActiveSessions.length} stale active sessions for user ${userId}`);

            for (const staleSession of staleActiveSessions) {
                const endTime = new Date();
                const durationMinutes = Math.round((endTime.getTime() - staleSession.startTime.getTime()) / (1000 * 60));

                await prisma.focusSession.update({
                    where: { id: staleSession.id },
                    data: {
                        endTime,
                        durationMinutes,
                        completed: false // Mark as incomplete since it was abandoned
                    }
                });
            }
        }

        // Now check for genuinely active sessions (started today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeSessions = await prisma.focusSession.findMany({
            where: {
                userId,
                completed: false,
                endTime: null,
                startTime: {
                    gte: today // Only sessions started today
                }
            }
        });

        if (activeSessions.length > 0) {
            res.status(400).json({
                error: 'Active session exists',
                message: 'You already have an active focus session. Please complete it first.',
                activeSession: activeSessions[0]
            });
            return;
        }

        // If taskId provided, verify task belongs to user
        if (taskId) {
            const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    userId
                }
            });

            if (!task) {
                res.status(404).json({
                    error: 'Task not found',
                    message: 'Task not found or you do not have access to it'
                });
                return;
            }
        }

        const session = await prisma.focusSession.create({
            data: {
                startTime: new Date(),
                durationMinutes: durationMinutes, // Store the planned duration
                userId,
                taskId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true,
                        board: {
                            select: { id: true, name: true, type: true }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            message: `Focus session started! Time to get in the zone for ${durationMinutes} minutes! 🎯`,
            session
        });

    } catch (error) {
        console.error('Start focus session error:', error);
        res.status(500).json({
            error: 'Failed to start focus session',
            message: 'Internal server error'
        });
    }
};

// End focus session
export const endFocusSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { completed = true } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if session exists, belongs to user, and is active
        const session = await prisma.focusSession.findFirst({
            where: {
                id,
                userId,
                endTime: null // Only active sessions
            }
        });

        if (!session) {
            res.status(404).json({
                error: 'Active focus session not found',
                message: 'Active focus session not found or you do not have access to it'
            });
            return;
        }

        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - session.startTime.getTime()) / (1000 * 60));

        const updatedSession = await prisma.focusSession.update({
            where: { id },
            data: {
                endTime,
                durationMinutes,
                completed
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true,
                        board: {
                            select: { id: true, name: true, type: true }
                        }
                    }
                }
            }
        });

        // Update focus session streak if completed
        if (completed && durationMinutes >= 15) { // Minimum 15 minutes for streak
            // 🎉 Celebrate focus session completion
            const taskName = updatedSession.task?.taskName;
            await celebrateFocusSession(userId, durationMinutes, taskName);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const streak = await prisma.streak.findFirst({
                where: {
                    userId,
                    streakType: 'focus_sessions'
                }
            });

            if (streak) {
                const lastUpdate = new Date(streak.lastUpdate);
                lastUpdate.setHours(0, 0, 0, 0);

                const daysDiff = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff === 0) {
                    // Same day, no change needed
                } else if (daysDiff === 1) {
                    // Next day, increment streak
                    const newCount = streak.currentCount + 1;
                    await prisma.streak.update({
                        where: { id: streak.id },
                        data: {
                            currentCount: newCount,
                            lastUpdate: new Date(),
                            longestStreak: Math.max(streak.longestStreak, newCount)
                        }
                    });

                    // 🔥 Celebrate streak milestones
                    await celebrateStreakMilestone(userId, 'focus_sessions', newCount);
                } else {
                    // Streak broken, reset to 1
                    await prisma.streak.update({
                        where: { id: streak.id },
                        data: {
                            currentCount: 1,
                            lastUpdate: new Date()
                        }
                    });
                }
            } else {
                // Create focus session streak
                await prisma.streak.create({
                    data: {
                        streakType: 'focus_sessions',
                        currentCount: 1,
                        lastUpdate: new Date(),
                        longestStreak: 1,
                        userId
                    }
                });
            }
        }

        const message = completed
            ? `Focus session completed! You focused for ${durationMinutes} minutes! 🎉`
            : `Focus session ended after ${durationMinutes} minutes.`;

        res.json({
            message,
            session: updatedSession
        });

    } catch (error) {
        console.error('End focus session error:', error);
        res.status(500).json({
            error: 'Failed to end focus session',
            message: 'Internal server error'
        });
    }
};

// Get active focus session
export const getActiveSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const activeSession = await prisma.focusSession.findFirst({
            where: {
                userId,
                completed: false,
                endTime: null
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true,
                        board: {
                            select: { id: true, name: true, type: true }
                        }
                    }
                }
            }
        });

        if (!activeSession) {
            res.json({
                message: 'No active focus session',
                session: null
            });
            return;
        }

        // Calculate current duration
        const currentDuration = Math.round((new Date().getTime() - activeSession.startTime.getTime()) / (1000 * 60));

        res.json({
            message: 'Active focus session found',
            session: {
                ...activeSession,
                currentDurationMinutes: currentDuration
            }
        });

    } catch (error) {
        console.error('Get active session error:', error);
        res.status(500).json({
            error: 'Failed to retrieve active session',
            message: 'Internal server error'
        });
    }
};

// Get focus statistics
export const getFocusStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { period = 'week' } = req.query as { period?: FocusPeriod };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(0); // All time
        }

        const where: WhereClause = {
            userId,
            completed: true
        };

        if (period !== 'all') {
            where.startTime = { gte: startDate };
        }

        const [totalSessions, totalMinutes, avgDuration, longestSession, focusStreak] = await Promise.all([
            // Total completed sessions
            prisma.focusSession.count({ where }),

            // Total focus minutes
            prisma.focusSession.aggregate({
                where,
                _sum: { durationMinutes: true }
            }),

            // Average session duration
            prisma.focusSession.aggregate({
                where,
                _avg: { durationMinutes: true }
            }),

            // Longest session
            prisma.focusSession.findFirst({
                where,
                orderBy: { durationMinutes: 'desc' },
                select: { durationMinutes: true, startTime: true, task: { select: { taskName: true } } }
            }),

            // Current focus streak
            prisma.streak.findFirst({
                where: {
                    userId,
                    streakType: 'focus_sessions'
                }
            })
        ]);

        // Get sessions by day for chart data
        const sessionsOverTime = await prisma.focusSession.findMany({
            where,
            select: {
                startTime: true,
                durationMinutes: true
            },
            orderBy: { startTime: 'asc' }
        });

        // Group by date
        const sessionsByDate: Record<string, { count: number; totalMinutes: number }> = {};

        sessionsOverTime.forEach((session: any) => {
            const dateKey = session.startTime.toISOString().split('T')[0];
            if (!sessionsByDate[dateKey]) {
                sessionsByDate[dateKey] = { count: 0, totalMinutes: 0 };
            }
            sessionsByDate[dateKey].count += 1;
            sessionsByDate[dateKey].totalMinutes += session.durationMinutes || 0;
        });

        // Get most productive hours
        const hourlyData: Record<number, number> = {};
        sessionsOverTime.forEach((session: any) => {
            const hour = session.startTime.getHours();
            hourlyData[hour] = (hourlyData[hour] || 0) + (session.durationMinutes || 0);
        });

        const stats = {
            period,
            totalSessions,
            totalMinutes: totalMinutes._sum.durationMinutes || 0,
            totalHours: Math.round((totalMinutes._sum.durationMinutes || 0) / 60 * 100) / 100,
            avgDuration: Math.round(avgDuration._avg.durationMinutes || 0),
            longestSession: longestSession ? {
                duration: longestSession.durationMinutes,
                date: longestSession.startTime,
                task: longestSession.task?.taskName || 'No task'
            } : null,
            currentStreak: focusStreak?.currentCount || 0,
            longestStreak: focusStreak?.longestStreak || 0,
            sessionsByDate,
            hourlyProductivity: hourlyData,
            insights: {
                averageSessionsPerDay: period !== 'all' ? Math.round((totalSessions / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))) * 100) / 100 : 0,
                mostProductiveHour: Object.entries(hourlyData).reduce((max, [hour, minutes]) =>
                    minutes > max.minutes ? { hour: parseInt(hour), minutes } : max,
                    { hour: 0, minutes: 0 }
                )
            }
        };

        res.json({
            message: 'Focus statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get focus stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve focus statistics',
            message: 'Internal server error'
        });
    }
};

// Get today's focus summary
export const getTodayFocusSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const [todaySessions, totalMinutes, activeSession] = await Promise.all([
            // Today's completed sessions
            prisma.focusSession.findMany({
                where: {
                    userId,
                    completed: true,
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    task: {
                        select: { id: true, taskName: true, priority: true }
                    }
                },
                orderBy: { startTime: 'desc' }
            }),

            // Total minutes today
            prisma.focusSession.aggregate({
                where: {
                    userId,
                    completed: true,
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                _sum: { durationMinutes: true }
            }),

            // Active session
            prisma.focusSession.findFirst({
                where: {
                    userId,
                    completed: false,
                    endTime: null
                },
                include: {
                    task: {
                        select: { id: true, taskName: true, priority: true }
                    }
                }
            })
        ]);

        const summary = {
            sessionsCompleted: todaySessions.length,
            totalMinutes: totalMinutes._sum.durationMinutes || 0,
            totalHours: Math.round((totalMinutes._sum.durationMinutes || 0) / 60 * 100) / 100,
            activeSession: activeSession ? {
                ...activeSession,
                currentDurationMinutes: Math.round((new Date().getTime() - activeSession.startTime.getTime()) / (1000 * 60))
            } : null,
            sessions: todaySessions,
            goal: {
                target: 240, // 4 hours default goal
                progress: Math.round(((totalMinutes._sum.durationMinutes || 0) / 240) * 100)
            }
        };

        res.json({
            message: 'Today\'s focus summary retrieved successfully',
            summary
        });

    } catch (error) {
        console.error('Get today focus summary error:', error);
        res.status(500).json({
            error: 'Failed to retrieve today\'s focus summary',
            message: 'Internal server error'
        });
    }
};

// Delete focus session
export const deleteFocusSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if session exists and belongs to user
        const existingSession = await prisma.focusSession.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingSession) {
            res.status(404).json({
                error: 'Focus session not found',
                message: 'Focus session not found or you do not have access to it'
            });
            return;
        }

        await prisma.focusSession.delete({
            where: { id }
        });

        res.json({
            message: 'Focus session deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete focus session error:', error);
        res.status(500).json({
            error: 'Failed to delete focus session',
            message: 'Internal server error'
        });
    }
};