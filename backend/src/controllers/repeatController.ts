import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    RepeatPeriod,
    ApiResponse,
    PaginatedResponse,
    WhereClause
} from '../types';
import { repeatScheduler } from '../services/repeatScheduler';

// Get all repeats for a task
export const getTaskRepeats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Verify task belongs to user
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

        const repeat = await prisma.repeat.findUnique({
            where: { taskId },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        board: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        res.json({
            message: 'Task repeat configuration retrieved successfully',
            repeat
        });

    } catch (error) {
        console.error('Get task repeats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve task repeat configuration',
            message: 'Internal server error'
        });
    }
};

// Get all user's repeating tasks
export const getUserRepeats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            periodType,
            active = 'true',
            page = '1',
            limit = '20'
        } = req.query as {
            periodType?: RepeatPeriod;
            active?: string;
            page?: string;
            limit?: string;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Build where clause
        const where: WhereClause = {
            task: {
                userId
            }
        };

        if (periodType) where.periodType = periodType;

        // Filter active/inactive repeats
        if (active === 'true') {
            where.OR = [
                { infiniteRepeat: true },
                { endDate: { gte: new Date() } }
            ];
        } else if (active === 'false') {
            where.AND = [
                { infiniteRepeat: false },
                { endDate: { lt: new Date() } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [repeats, totalCount] = await Promise.all([
            prisma.repeat.findMany({
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
                            },
                            list: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                },
                orderBy: { id: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.repeat.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'User repeat configurations retrieved successfully',
            repeats,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get user repeats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve repeat configurations',
            message: 'Internal server error'
        });
    }
};

// Create repeat configuration for a task
export const createRepeat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;
        const {
            periodType,
            periodValue = 1,
            repeatDays = [],
            endDate,
            infiniteRepeat = false
        } = req.body as {
            periodType: RepeatPeriod;
            periodValue?: number;
            repeatDays?: string[];
            endDate?: Date;
            infiniteRepeat?: boolean;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Verify task belongs to user
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

        // Check if repeat already exists for this task
        const existingRepeat = await prisma.repeat.findUnique({
            where: { taskId }
        });

        if (existingRepeat) {
            res.status(400).json({
                error: 'Repeat already exists',
                message: 'This task already has a repeat configuration. Use update instead.'
            });
            return;
        }

        // Validate repeat days for weekly repeats
        if (periodType === 'weekly' && repeatDays.length === 0) {
            res.status(400).json({
                error: 'Invalid repeat configuration',
                message: 'Weekly repeats must specify at least one day'
            });
            return;
        }

        // Validate end date
        if (!infiniteRepeat && endDate && new Date(endDate) <= new Date()) {
            res.status(400).json({
                error: 'Invalid end date',
                message: 'End date must be in the future'
            });
            return;
        }

        const repeat = await prisma.repeat.create({
            data: {
                periodType,
                periodValue,
                repeatDays,
                endDate: endDate ? new Date(endDate) : null,
                infiniteRepeat,
                taskId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        board: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        // Schedule the first occurrence
        await scheduleNextOccurrence(repeat);

        res.status(201).json({
            message: `Repeat configuration created! Task "${task.taskName}" will now repeat ${periodType}ly! 🔄`,
            repeat
        });

    } catch (error) {
        console.error('Create repeat error:', error);
        res.status(500).json({
            error: 'Failed to create repeat configuration',
            message: 'Internal server error'
        });
    }
};

// Update repeat configuration
export const updateRepeat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const {
            periodType,
            periodValue,
            repeatDays,
            endDate,
            infiniteRepeat
        } = req.body as {
            periodType?: RepeatPeriod;
            periodValue?: number;
            repeatDays?: string[];
            endDate?: Date;
            infiniteRepeat?: boolean;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if repeat exists and user has access
        const existingRepeat = await prisma.repeat.findFirst({
            where: {
                id,
                task: {
                    userId
                }
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true
                    }
                }
            }
        });

        if (!existingRepeat) {
            res.status(404).json({
                error: 'Repeat configuration not found',
                message: 'Repeat configuration not found or you do not have access to it'
            });
            return;
        }

        // Validate repeat days for weekly repeats
        if (periodType === 'weekly' && repeatDays && repeatDays.length === 0) {
            res.status(400).json({
                error: 'Invalid repeat configuration',
                message: 'Weekly repeats must specify at least one day'
            });
            return;
        }

        // Validate end date
        if (infiniteRepeat === false && endDate && new Date(endDate) <= new Date()) {
            res.status(400).json({
                error: 'Invalid end date',
                message: 'End date must be in the future'
            });
            return;
        }

        const updatedRepeat = await prisma.repeat.update({
            where: { id },
            data: {
                ...(periodType && { periodType }),
                ...(periodValue !== undefined && { periodValue }),
                ...(repeatDays !== undefined && { repeatDays }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(infiniteRepeat !== undefined && { infiniteRepeat })
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        board: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        res.json({
            message: `Repeat configuration updated! "${existingRepeat.task.taskName}" repeat schedule has been modified! ✨`,
            repeat: updatedRepeat
        });

    } catch (error) {
        console.error('Update repeat error:', error);
        res.status(500).json({
            error: 'Failed to update repeat configuration',
            message: 'Internal server error'
        });
    }
};

// Delete repeat configuration
export const deleteRepeat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if repeat exists and user has access
        const existingRepeat = await prisma.repeat.findFirst({
            where: {
                id,
                task: {
                    userId
                }
            },
            include: {
                task: {
                    select: {
                        taskName: true
                    }
                }
            }
        });

        if (!existingRepeat) {
            res.status(404).json({
                error: 'Repeat configuration not found',
                message: 'Repeat configuration not found or you do not have access to it'
            });
            return;
        }

        await prisma.repeat.delete({
            where: { id }
        });

        res.json({
            message: `Repeat configuration deleted! "${existingRepeat.task.taskName}" will no longer repeat automatically. 🗑️`
        });

    } catch (error) {
        console.error('Delete repeat error:', error);
        res.status(500).json({
            error: 'Failed to delete repeat configuration',
            message: 'Internal server error'
        });
    }
};

// Get upcoming repeat occurrences
export const getUpcomingOccurrences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            taskId,
            days = '30',
            limit = '20'
        } = req.query as {
            taskId?: string;
            days?: string;
            limit?: string;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const daysNum = parseInt(days);
        const limitNum = parseInt(limit);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysNum);

        // Build where clause
        const where: WhereClause = {
            task: {
                userId
            },
            OR: [
                { infiniteRepeat: true },
                { endDate: { gte: new Date() } }
            ]
        };

        if (taskId) {
            where.taskId = taskId;
        }

        const repeats = await prisma.repeat.findMany({
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
            take: limitNum
        });

        // Calculate upcoming occurrences
        const occurrences: Array<{
            repeatId: string;
            taskId: string;
            taskName: string;
            priority: string;
            boardName: string;
            nextOccurrence: Date;
            periodType: string;
            periodValue: number;
        }> = [];

        for (const repeat of repeats) {
            const nextOccurrence = calculateNextOccurrence(repeat);
            if (nextOccurrence && nextOccurrence <= endDate) {
                occurrences.push({
                    repeatId: repeat.id,
                    taskId: repeat.task.id,
                    taskName: repeat.task.taskName,
                    priority: repeat.task.priority,
                    boardName: repeat.task.board.name,
                    nextOccurrence,
                    periodType: repeat.periodType,
                    periodValue: repeat.periodValue
                });
            }
        }

        // Sort by next occurrence
        occurrences.sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());

        res.json({
            message: 'Upcoming repeat occurrences retrieved successfully',
            occurrences,
            summary: {
                totalRepeats: repeats.length,
                upcomingOccurrences: occurrences.length,
                periodCovered: `${daysNum} days`
            }
        });

    } catch (error) {
        console.error('Get upcoming occurrences error:', error);
        res.status(500).json({
            error: 'Failed to retrieve upcoming occurrences',
            message: 'Internal server error'
        });
    }
};

// Process repeats (create new task instances)
export const processRepeats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Use the scheduler service to process repeats for this user
        const result = await repeatScheduler.processRepeatsForUser(userId);

        res.json({
            message: `Processed ${result.processedCount} repeat configurations! 🔄`,
            summary: {
                totalProcessed: result.processedCount,
                tasksCreated: result.createdCount,
                createdTasks: result.createdTasks
            }
        });

    } catch (error) {
        console.error('Process repeats error:', error);
        res.status(500).json({
            error: 'Failed to process repeat occurrences',
            message: 'Internal server error'
        });
    }
};

// Helper function to calculate next occurrence
function calculateNextOccurrence(repeat: any): Date | null {
    const now = new Date();
    const { periodType, periodValue, repeatDays, endDate, infiniteRepeat } = repeat;

    // Check if repeat has ended
    if (!infiniteRepeat && endDate && new Date(endDate) < now) {
        return null;
    }

    let nextOccurrence = new Date(now);

    switch (periodType) {
        case 'daily':
            nextOccurrence.setDate(now.getDate() + periodValue);
            break;

        case 'weekly':
            // Find next occurrence based on repeat days
            if (repeatDays && repeatDays.length > 0) {
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const currentDay = now.getDay();

                // Find next valid day
                let daysToAdd = 1;
                for (let i = 1; i <= 7; i++) {
                    const checkDay = (currentDay + i) % 7;
                    const dayName = dayNames[checkDay];

                    if (repeatDays.includes(dayName)) {
                        daysToAdd = i;
                        break;
                    }
                }

                nextOccurrence.setDate(now.getDate() + daysToAdd);
            } else {
                nextOccurrence.setDate(now.getDate() + (7 * periodValue));
            }
            break;

        case 'monthly':
            nextOccurrence.setMonth(now.getMonth() + periodValue);
            break;

        case 'yearly':
            nextOccurrence.setFullYear(now.getFullYear() + periodValue);
            break;

        default:
            return null;
    }

    // Ensure it's still within the end date
    if (!infiniteRepeat && endDate && nextOccurrence > new Date(endDate)) {
        return null;
    }

    return nextOccurrence;
}

// Helper function to schedule next occurrence (for background processing)
async function scheduleNextOccurrence(repeat: any): Promise<void> {
    // This would typically integrate with a job queue like Bull or Agenda
    // For now, we'll just log it
    const nextOccurrence = calculateNextOccurrence(repeat);
    if (nextOccurrence) {
        console.log(`📅 Next occurrence for task "${repeat.task.taskName}" scheduled for ${nextOccurrence.toISOString()}`);
    }
}

// Get repeat statistics
export const getRepeatStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const [
            totalRepeats,
            activeRepeats,
            completedRepeats,
            repeatsByType,
            upcomingCount
        ] = await Promise.all([
            // Total repeats
            prisma.repeat.count({
                where: { task: { userId } }
            }),

            // Active repeats
            prisma.repeat.count({
                where: {
                    task: { userId },
                    OR: [
                        { infiniteRepeat: true },
                        { endDate: { gte: new Date() } }
                    ]
                }
            }),

            // Completed/expired repeats
            prisma.repeat.count({
                where: {
                    task: { userId },
                    infiniteRepeat: false,
                    endDate: { lt: new Date() }
                }
            }),

            // Group by period type
            prisma.repeat.groupBy({
                by: ['periodType'],
                where: { task: { userId } },
                _count: { id: true }
            }),

            // Upcoming occurrences (next 7 days)
            prisma.repeat.count({
                where: {
                    task: { userId },
                    OR: [
                        { infiniteRepeat: true },
                        { endDate: { gte: new Date() } }
                    ]
                }
            })
        ]);

        const stats = {
            overview: {
                totalRepeats,
                activeRepeats,
                completedRepeats,
                upcomingThisWeek: upcomingCount
            },
            breakdown: repeatsByType.reduce((acc: any, item: any) => {
                acc[item.periodType] = item._count.id;
                return acc;
            }, {}),
            efficiency: {
                activePercentage: totalRepeats > 0 ? Math.round((activeRepeats / totalRepeats) * 100) : 0,
                mostCommonType: repeatsByType.reduce(
                    (max: any, item: any) => item._count.id > max.count ? { type: item.periodType, count: item._count.id } : max,
                    { type: 'none', count: 0 }
                )
            }
        };

        res.json({
            message: 'Repeat statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get repeat stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve repeat statistics',
            message: 'Internal server error'
        });
    }
};