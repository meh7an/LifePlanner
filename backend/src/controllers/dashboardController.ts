import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    DashboardStats,
    TodayOverview,
    TaskWithDetails,
    CalendarEventWithDetails,
    FocusSessionWithTask,
    NoteWithTask,
    ApiResponse
} from '../types';

// Helper function to calculate productivity score
const calculateProductivityScore = async (
    userId: string,
    completedTasks: number,
    totalTasks: number,
    todayFocusMinutes: number,
    weeklyFocusMinutes: number,
    overdueCount: number,
    currentFocusStreak: number
): Promise<{ score: number; trend: 'up' | 'down' | 'stable'; weeklyComparison: number }> => {
    // Base score components (0-100 scale)

    // 1. Completion rate (0-35 points)
    const completionScore = totalTasks > 0 ? (completedTasks / totalTasks) * 35 : 0;

    // 2. Focus score for today (0-25 points) - 1 point per 6 minutes
    const focusScore = Math.min(25, Math.floor(todayFocusMinutes / 6));

    // 3. Consistency bonus from weekly focus (0-20 points)
    const weeklyFocusScore = Math.min(20, Math.floor(weeklyFocusMinutes / 30));

    // 4. Streak bonus (0-15 points)
    const streakBonus = Math.min(15, currentFocusStreak * 1.5);

    // 5. Penalty for overdue tasks (0-20 points deducted)
    const overduePenalty = Math.min(20, overdueCount * 2.5);

    // Calculate final score
    const rawScore = completionScore + focusScore + weeklyFocusScore + streakBonus - overduePenalty;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Calculate weekly comparison for trend
    const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [lastWeekTasks, lastWeekFocus] = await Promise.all([
        prisma.task.count({
            where: {
                userId,
                completed: true,
                completedAt: {
                    gte: lastWeekStart,
                    lt: thisWeekStart
                }
            }
        }),
        prisma.focusSession.aggregate({
            where: {
                userId,
                completed: true,
                startTime: {
                    gte: lastWeekStart,
                    lt: thisWeekStart
                }
            },
            _sum: { durationMinutes: true }
        })
    ]);

    // Calculate last week's score for comparison
    const lastWeekCompletionScore = lastWeekTasks > 0 ? (lastWeekTasks / (lastWeekTasks + 5)) * 35 : 0; // Estimate
    const lastWeekFocusScore = Math.min(45, Math.floor((lastWeekFocus._sum.durationMinutes || 0) / 15));
    const lastWeekScore = Math.max(0, Math.min(100, Math.round(lastWeekCompletionScore + lastWeekFocusScore)));

    const weeklyComparison = score - lastWeekScore;

    // Determine trend
    let trend: 'up' | 'down' | 'stable';
    if (weeklyComparison > 5) {
        trend = 'up';
    } else if (weeklyComparison < -5) {
        trend = 'down';
    } else {
        trend = 'stable';
    }

    return { score, trend, weeklyComparison };
};

// Get comprehensive dashboard overview
export const getDashboardOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Parallel queries for all dashboard data
        const [
            // Task statistics
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            dueToday,
            completedToday,
            newTasksToday,

            // Focus statistics
            todayFocusMinutes,
            todayFocusSessions,
            weeklyFocusMinutes,
            totalFocusSessions,
            longestSession,
            averageSessionLength,
            completedSessions,
            currentFocusStreak,
            longestFocusStreak,
            activeSession,

            // Board statistics
            totalBoards,
            activeBoards,
            archivedBoards,
            averageTasksPerBoard,

            // Calendar statistics
            upcomingEvents,
            todayEvents,
            overdueEvents,

            // Notes statistics
            totalNotes,
            notesThisWeek,
            notesThisMonth,

            // Streak statistics
            taskStreak,
            focusStreak
        ] = await Promise.all([
            // Tasks
            prisma.task.count({ where: { userId } }),
            prisma.task.count({ where: { userId, completed: true } }),
            prisma.task.count({ where: { userId, completed: false } }),
            prisma.task.count({
                where: {
                    userId,
                    completed: false,
                    dueTime: { lt: new Date() }
                }
            }),
            prisma.task.count({
                where: {
                    userId,
                    completed: false,
                    dueTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.task.count({
                where: {
                    userId,
                    completed: true,
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.task.count({
                where: {
                    userId,
                    newTask: true,
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),

            // Focus - Enhanced statistics
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
            prisma.focusSession.count({
                where: {
                    userId,
                    completed: true,
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.focusSession.aggregate({
                where: {
                    userId,
                    completed: true,
                    startTime: { gte: startOfWeek }
                },
                _sum: { durationMinutes: true }
            }),
            prisma.focusSession.count({
                where: { userId, completed: true }
            }),
            prisma.focusSession.findFirst({
                where: { userId, completed: true },
                orderBy: { durationMinutes: 'desc' },
                select: { durationMinutes: true }
            }),
            prisma.focusSession.aggregate({
                where: { userId, completed: true },
                _avg: { durationMinutes: true }
            }),
            prisma.focusSession.count({
                where: { userId, completed: true }
            }),
            prisma.streak.findFirst({
                where: { userId, streakType: 'focus_sessions' },
                select: { currentCount: true }
            }),
            prisma.streak.findFirst({
                where: { userId, streakType: 'focus_sessions' },
                select: { longestStreak: true }
            }),
            prisma.focusSession.findFirst({
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
                            priority: true
                        }
                    }
                }
            }),

            // Boards - Enhanced statistics
            prisma.board.count({ where: { userId } }),
            prisma.board.count({ where: { userId, isArchived: false } }),
            prisma.board.count({ where: { userId, isArchived: true } }),
            prisma.task.groupBy({
                by: ['boardId'],
                where: { userId },
                _count: { id: true }
            }).then(groups => {
                const totalTasks = groups.reduce((sum, group) => sum + group._count.id, 0);
                return groups.length > 0 ? Math.round(totalTasks / groups.length) : 0;
            }),

            // Calendar - Enhanced statistics
            prisma.calendarEvent.count({
                where: {
                    calendar: { userId },
                    startTime: { gte: new Date() }
                }
            }),
            prisma.calendarEvent.count({
                where: {
                    calendar: { userId },
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.calendarEvent.count({
                where: {
                    calendar: { userId },
                    startTime: { lt: new Date() },
                    endTime: { gt: new Date() }
                }
            }),

            // Notes - Enhanced statistics
            prisma.note.count({
                where: { task: { userId } }
            }),
            prisma.note.count({
                where: {
                    task: { userId },
                    createdAt: { gte: startOfWeek }
                }
            }),
            prisma.note.count({
                where: {
                    task: { userId },
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            }),

            // Streaks
            prisma.streak.findFirst({
                where: { userId, streakType: 'daily_tasks' },
                select: { currentCount: true }
            }),
            prisma.streak.findFirst({
                where: { userId, streakType: 'focus_sessions' },
                select: { currentCount: true }
            })
        ]);

        // Calculate productivity score
        const productivity = await calculateProductivityScore(
            userId,
            completedTasks,
            totalTasks,
            todayFocusMinutes._sum.durationMinutes || 0,
            weeklyFocusMinutes._sum.durationMinutes || 0,
            overdueTasks,
            currentFocusStreak?.currentCount || 0
        );

        const stats: DashboardStats = {
            tasks: {
                total: totalTasks,
                completed: completedTasks,
                pending: pendingTasks,
                overdue: overdueTasks,
                dueToday,
                newToday: newTasksToday,
                completedToday,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            },
            focus: {
                totalMinutes: weeklyFocusMinutes._sum.durationMinutes || 0,
                totalSessions: totalFocusSessions,
                todayMinutes: todayFocusMinutes._sum.durationMinutes || 0,
                todaySessions: todayFocusSessions,
                averageSessionLength: Math.round(averageSessionLength._avg.durationMinutes || 0),
                longestSession: longestSession?.durationMinutes || 0,
                longestStreak: longestFocusStreak?.longestStreak || 0,
                currentStreak: currentFocusStreak?.currentCount || 0,
                completionRate: totalFocusSessions > 0 ? Math.round((completedSessions / totalFocusSessions) * 100) : 0,
                activeSession: activeSession ? {
                    ...activeSession,
                    currentDurationMinutes: Math.round((new Date().getTime() - activeSession.startTime.getTime()) / (1000 * 60))
                } as FocusSessionWithTask : undefined
            },
            boards: {
                total: totalBoards,
                active: activeBoards,
                archived: archivedBoards,
                averageTasksPerBoard
            },
            calendar: {
                totalEvents: upcomingEvents + todayEvents,
                todayEvents,
                upcomingEvents,
                overdueEvents
            },
            notes: {
                total: totalNotes,
                thisWeek: notesThisWeek,
                thisMonth: notesThisMonth
            },
            streaks: [
                {
                    type: 'daily_tasks',
                    current: taskStreak?.currentCount || 0,
                    longest: taskStreak?.currentCount || 0 // You might want to add longestStreak to your streak model
                },
                {
                    type: 'focus_sessions',
                    current: focusStreak?.currentCount || 0,
                    longest: longestFocusStreak?.longestStreak || 0
                }
            ],
            productivity: {
                score: productivity.score,
                trend: productivity.trend,
                weeklyComparison: productivity.weeklyComparison
            }
        };

        res.json({
            message: 'Dashboard overview retrieved successfully',
            stats,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({
            error: 'Failed to retrieve dashboard overview',
            message: 'Internal server error'
        });
    }
};

// Get today's detailed overview
export const getTodayOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const [dueTasks, newTasks, completedToday, todayEvents, focusSummary, recentNotes] = await Promise.all([
            // Tasks due today
            prisma.task.findMany({
                where: {
                    userId,
                    dueTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    board: { select: { id: true, name: true, type: true } },
                    list: { select: { id: true, name: true } },
                    _count: { select: { steps: true, notes: true } }
                },
                orderBy: { dueTime: 'asc' },
                take: 10
            }),

            // New tasks (created recently or marked as new)
            prisma.task.findMany({
                where: {
                    userId,
                    newTask: true,
                    completed: false
                },
                include: {
                    board: { select: { id: true, name: true, type: true } },
                    list: { select: { id: true, name: true } },
                    _count: { select: { steps: true, notes: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),

            // Tasks completed today
            prisma.task.count({
                where: {
                    userId,
                    completed: true,
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),

            // Today's events
            prisma.calendarEvent.findMany({
                where: {
                    calendar: { userId },
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    calendar: { select: { id: true, name: true } },
                    task: {
                        select: {
                            id: true,
                            taskName: true,
                            priority: true,
                            completed: true
                        }
                    }
                },
                orderBy: { startTime: 'asc' }
            }),

            // Focus summary for today
            Promise.all([
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
            ]),

            // Recent notes (last 3 days)
            prisma.note.findMany({
                where: {
                    task: { userId },
                    createdAt: {
                        gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    task: {
                        select: {
                            id: true,
                            taskName: true,
                            priority: true,
                            board: { select: { id: true, name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        const [todaySessions, totalMinutes, activeSession] = focusSummary;

        const overview: TodayOverview = {
            date: today,
            tasks: {
                due: dueTasks as TaskWithDetails[],
                new: newTasks as TaskWithDetails[],
                completed: completedToday
            },
            events: todayEvents as CalendarEventWithDetails[],
            focusSummary: {
                sessionsCompleted: todaySessions.length,
                totalMinutes: totalMinutes._sum.durationMinutes || 0,
                totalHours: Math.round(((totalMinutes._sum.durationMinutes || 0) / 60) * 100) / 100,
                activeSession: activeSession ? {
                    ...activeSession,
                    currentDurationMinutes: Math.round((new Date().getTime() - activeSession.startTime.getTime()) / (1000 * 60))
                } as FocusSessionWithTask : undefined,
                sessions: todaySessions as FocusSessionWithTask[],
                goal: {
                    target: 240, // 4 hours default
                    progress: Math.round(((totalMinutes._sum.durationMinutes || 0) / 240) * 100)
                }
            },
            recentNotes: recentNotes as NoteWithTask[]
        };

        res.json({
            message: 'Today\'s overview retrieved successfully',
            overview
        });

    } catch (error) {
        console.error('Get today overview error:', error);
        res.status(500).json({
            error: 'Failed to retrieve today\'s overview',
            message: 'Internal server error'
        });
    }
};

// Get productivity insights and recommendations
export const getProductivityInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { period = 'week' } = req.query as { period?: 'week' | 'month' };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const now = new Date();
        const startDate = period === 'week'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            completionRate,
            focusPatterns,
            productiveHours,
            mostActiveBoards,
            streakData,
            overdueTrend
        ] = await Promise.all([
            // Task completion rate
            Promise.all([
                prisma.task.count({
                    where: {
                        userId,
                        createdAt: { gte: startDate }
                    }
                }),
                prisma.task.count({
                    where: {
                        userId,
                        completed: true,
                        completedAt: { gte: startDate }
                    }
                })
            ]),

            // Focus session patterns
            prisma.focusSession.findMany({
                where: {
                    userId,
                    completed: true,
                    startTime: { gte: startDate }
                },
                select: {
                    startTime: true,
                    durationMinutes: true
                }
            }),

            // Most productive hours analysis
            prisma.focusSession.groupBy({
                by: ['startTime'],
                where: {
                    userId,
                    completed: true,
                    startTime: { gte: startDate }
                },
                _sum: { durationMinutes: true }
            }),

            // Most active boards
            prisma.task.groupBy({
                by: ['boardId'],
                where: {
                    userId,
                    createdAt: { gte: startDate }
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            }),

            // Streak analysis
            prisma.streak.findMany({
                where: { userId },
                select: {
                    streakType: true,
                    currentCount: true,
                    longestStreak: true,
                    lastUpdate: true
                }
            }),

            // Overdue tasks trend
            prisma.task.count({
                where: {
                    userId,
                    completed: false,
                    dueTime: { lt: now }
                }
            })
        ]);

        // Calculate insights
        const [totalTasksCreated, totalTasksCompleted] = completionRate;
        const completionRatePercentage = totalTasksCreated > 0
            ? Math.round((totalTasksCompleted / totalTasksCreated) * 100)
            : 0;

        // Analyze focus patterns
        const hourlyFocus: Record<number, number> = {};
        focusPatterns.forEach((session: any) => {
            const hour = session.startTime.getHours();
            hourlyFocus[hour] = (hourlyFocus[hour] || 0) + (session.durationMinutes || 0);
        });

        const bestFocusHour = Object.entries(hourlyFocus).reduce(
            (best, [hour, minutes]) => minutes > best.minutes ? { hour: parseInt(hour), minutes } : best,
            { hour: 9, minutes: 0 }
        );

        // Get board names for most active boards
        const boardsWithNames = await Promise.all(
            mostActiveBoards.map(async (board: any) => {
                const boardData = await prisma.board.findUnique({
                    where: { id: board.boardId },
                    select: { id: true, name: true, type: true }
                });
                return {
                    board: boardData,
                    taskCount: board._count.id
                };
            })
        );

        const insights = {
            period,
            summary: {
                completionRate: completionRatePercentage,
                totalFocusMinutes: focusPatterns.reduce((sum: number, s: { startTime: Date; durationMinutes: number | null }) => sum + (s.durationMinutes || 0), 0),
                averageSessionLength: focusPatterns.length > 0
                    ? Math.round(focusPatterns.reduce((sum: number, s: { startTime: Date; durationMinutes: number | null }) => sum + (s.durationMinutes || 0), 0) / focusPatterns.length)
                    : 0,
                overdueTasksCount: overdueTrend
            },
            patterns: {
                bestFocusHour: bestFocusHour.hour,
                averageFocusMinutesPerHour: bestFocusHour.minutes,
                mostProductiveDays: analyzeMostProductiveDays(focusPatterns),
                peakProductivityTime: `${bestFocusHour.hour}:00 - ${bestFocusHour.hour + 1}:00`
            },
            activity: {
                mostActiveBoards: boardsWithNames.filter(b => b.board !== null),
                currentStreaks: streakData.map((s: { streakType: string; currentCount: number; longestStreak: number; lastUpdate: Date }) => ({
                    type: s.streakType,
                    current: s.currentCount,
                    longest: s.longestStreak,
                    lastUpdate: s.lastUpdate
                }))
            },
            recommendations: generateRecommendations({
                completionRate: completionRatePercentage,
                focusMinutes: focusPatterns.reduce((sum: number, s: { startTime: Date; durationMinutes: number | null }) => sum + (s.durationMinutes || 0), 0),
                overdueTasks: overdueTrend,
                bestHour: bestFocusHour.hour,
                streaks: streakData
            })
        };

        res.json({
            message: 'Productivity insights retrieved successfully',
            insights
        });

    } catch (error) {
        console.error('Get productivity insights error:', error);
        res.status(500).json({
            error: 'Failed to retrieve productivity insights',
            message: 'Internal server error'
        });
    }
};

// Helper method to analyze most productive days
function analyzeMostProductiveDays(focusPatterns: Array<{ startTime: Date; durationMinutes: number | null }>): string[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyFocus: Record<number, number> = {};

    focusPatterns.forEach(session => {
        const day = session.startTime.getDay();
        dailyFocus[day] = (dailyFocus[day] || 0) + (session.durationMinutes || 0);
    });

    return Object.entries(dailyFocus)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([day]) => dayNames[parseInt(day)]);
}

// Helper method to generate personalized recommendations
function generateRecommendations(data: {
    completionRate: number;
    focusMinutes: number;
    overdueTasks: number;
    bestHour: number;
    streaks: Array<{ streakType: string; currentCount: number; longestStreak: number }>;
}): string[] {
    const recommendations: string[] = [];

    if (data.completionRate < 70) {
        recommendations.push("🎯 Try breaking large tasks into smaller, manageable steps to improve completion rate");
    }

    if (data.focusMinutes < 120) {
        recommendations.push("⏰ Aim for at least 2 hours of focused work daily - start with 25-minute sessions");
    }

    if (data.overdueTasks > 5) {
        recommendations.push("📅 Schedule a 30-minute session to tackle overdue tasks and prevent buildup");
    }

    if (data.bestHour >= 9 && data.bestHour <= 11) {
        recommendations.push("🌅 You're most productive in the morning - schedule important tasks between 9-11 AM");
    } else if (data.bestHour >= 14 && data.bestHour <= 16) {
        recommendations.push("☀️ Your peak focus time is afternoon - block 2-4 PM for deep work");
    }

    const focusStreak = data.streaks.find(s => s.streakType === 'focus_sessions');
    if (focusStreak && focusStreak.currentCount === 0) {
        recommendations.push("🔥 Start a focus session today to rebuild your productivity streak!");
    }

    if (recommendations.length === 0) {
        recommendations.push("🚀 You're doing great! Keep maintaining your productive habits");
    }

    return recommendations;
}

// Get weekly/monthly productivity stats comparison
export const getProductivityStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { period = 'week' } = req.query as { period?: 'week' | 'month' | 'year' };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const now = new Date();
        let startDate: Date;
        let previousStartDate: Date;

        switch (period) {
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        }

        const [currentStats, previousStats] = await Promise.all([
            // Current period stats
            Promise.all([
                prisma.task.count({ where: { userId, completed: true, completedAt: { gte: startDate } } }),
                prisma.focusSession.aggregate({
                    where: { userId, completed: true, startTime: { gte: startDate } },
                    _sum: { durationMinutes: true },
                    _count: { id: true }
                }),
                prisma.note.count({ where: { task: { userId }, createdAt: { gte: startDate } } })
            ]),

            // Previous period stats
            Promise.all([
                prisma.task.count({
                    where: {
                        userId,
                        completed: true,
                        completedAt: { gte: previousStartDate, lt: startDate }
                    }
                }),
                prisma.focusSession.aggregate({
                    where: {
                        userId,
                        completed: true,
                        startTime: { gte: previousStartDate, lt: startDate }
                    },
                    _sum: { durationMinutes: true },
                    _count: { id: true }
                }),
                prisma.note.count({
                    where: {
                        task: { userId },
                        createdAt: { gte: previousStartDate, lt: startDate }
                    }
                })
            ])
        ]);

        const [currentTasks, currentFocus, currentNotes] = currentStats;
        const [previousTasks, previousFocus, previousNotes] = previousStats;

        const calculateChange = (current: number, previous: number): { value: number; percentage: number } => {
            const change = current - previous;
            const percentage = previous > 0 ? Math.round((change / previous) * 100) : 0;
            return { value: change, percentage };
        };

        const stats = {
            period,
            current: {
                tasksCompleted: currentTasks,
                focusMinutes: currentFocus._sum.durationMinutes || 0,
                focusSessions: currentFocus._count,
                notesCreated: currentNotes
            },
            previous: {
                tasksCompleted: previousTasks,
                focusMinutes: previousFocus._sum.durationMinutes || 0,
                focusSessions: previousFocus._count,
                notesCreated: previousNotes
            },
            changes: {
                tasks: calculateChange(currentTasks, previousTasks),
                focus: calculateChange(currentFocus._sum.durationMinutes || 0, previousFocus._sum.durationMinutes || 0),
                sessions: calculateChange(currentFocus._count.id, previousFocus._count.id),
                notes: calculateChange(currentNotes, previousNotes)
            }
        };

        res.json({
            message: 'Productivity statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get productivity stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve productivity statistics',
            message: 'Internal server error'
        });
    }
};