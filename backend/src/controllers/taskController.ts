import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    TaskWithDetails,
    TaskFilters,
    TaskPriority,
    TaskStatus,
    PaginatedResponse,
    ApiResponse,
    WhereClause,
    OrderByClause
} from '../types';
import { celebrateTaskCompletion } from './notificationsController';

// Get all tasks for authenticated user
export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            boardId,
            listId,
            completed,
            priority,
            status,
            dueDate,
            page = '1',
            limit = '20',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as {
            boardId?: string;
            listId?: string;
            completed?: string;
            priority?: TaskPriority;
            status?: TaskStatus;
            dueDate?: string;
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

        if (boardId) where.boardId = boardId;
        if (listId) where.listId = listId;
        if (completed !== undefined) where.completed = completed === 'true';
        if (priority) where.priority = priority;
        if (status) where.status = status;
        if (dueDate) {
            const date = new Date(dueDate as string);
            where.dueTime = {
                gte: new Date(date.setHours(0, 0, 0, 0)),
                lt: new Date(date.setHours(23, 59, 59, 999))
            };
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Valid sort fields
        const validSortFields = ['createdAt', 'updatedAt', 'taskName', 'dueTime', 'priority'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [tasks, totalCount] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    board: {
                        select: { id: true, name: true, type: true }
                    },
                    list: {
                        select: { id: true, name: true }
                    },
                    steps: {
                        orderBy: { orderIndex: 'asc' }
                    },
                    notes: {
                        orderBy: { createdAt: 'desc' },
                        take: 3 // Only get latest 3 notes
                    },
                    _count: {
                        select: { steps: true, notes: true }
                    }
                },
                orderBy: { [sortField]: sortDirection },
                skip,
                take: limitNum
            }),
            prisma.task.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Tasks retrieved successfully',
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            error: 'Failed to retrieve tasks',
            message: 'Internal server error'
        });
    }
};

// Get single task by ID
export const getTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const task = await prisma.task.findFirst({
            where: {
                id,
                userId
            },
            include: {
                board: {
                    select: { id: true, name: true, type: true }
                },
                list: {
                    select: { id: true, name: true }
                },
                steps: {
                    orderBy: { orderIndex: 'asc' }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                },
                repeat: true,
                events: {
                    include: {
                        calendar: {
                            select: { id: true, name: true }
                        }
                    }
                },
                focusSessions: {
                    orderBy: { startTime: 'desc' },
                    take: 5
                }
            }
        });

        if (!task) {
            res.status(404).json({
                error: 'Task not found',
                message: 'Task not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Task retrieved successfully',
            task
        });

    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            error: 'Failed to retrieve task',
            message: 'Internal server error'
        });
    }
};

// Create new task
export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskName, description, dueTime, priority, boardId, listId } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Verify board belongs to user
        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                userId
            }
        });

        if (!board) {
            res.status(404).json({
                error: 'Board not found',
                message: 'Board not found or you do not have access to it'
            });
            return;
        }

        // If listId provided, verify it belongs to the board
        if (listId) {
            const list = await prisma.list.findFirst({
                where: {
                    id: listId,
                    boardId
                }
            });

            if (!list) {
                res.status(404).json({
                    error: 'List not found',
                    message: 'List not found in the specified board'
                });
                return;
            }
        }

        const task = await prisma.task.create({
            data: {
                taskName,
                description,
                dueTime,
                priority,
                userId,
                boardId,
                listId
            },
            include: {
                board: {
                    select: { id: true, name: true, type: true }
                },
                list: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { steps: true, notes: true }
                }
            }
        });

        res.status(201).json({
            message: 'Task created successfully! 🎯',
            task
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            error: 'Failed to create task',
            message: 'Internal server error'
        });
    }
};

// Update task
export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { taskName, description, dueTime, completed, priority, status, listId } = req.body as {
            taskName?: string;
            description?: string;
            dueTime?: Date;
            completed?: boolean;
            priority?: TaskPriority;
            status?: TaskStatus;
            listId?: string;
        };
        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingTask) {
            res.status(404).json({
                error: 'Task not found',
                message: 'Task not found or you do not have access to it'
            });
            return;
        }

        // If listId is being changed, verify it belongs to the same board
        if (listId && listId !== existingTask.listId) {
            const list = await prisma.list.findFirst({
                where: {
                    id: listId,
                    boardId: existingTask.boardId
                }
            });

            if (!list) {
                res.status(400).json({
                    error: 'Invalid list',
                    message: 'List does not belong to the task\'s board'
                });
                return;
            }
        }

        // Handle task completion logic
        let updateData: Partial<{
            taskName: string;
            description: string;
            dueTime: Date;
            completed: boolean;
            priority: TaskPriority;
            status: TaskStatus;
            listId: string;
            newTask: boolean;
            completedAt: Date;
        }> = {
            ...(taskName && { taskName }),
            ...(description !== undefined && { description }),
            ...(dueTime !== undefined && { dueTime }),
            ...(priority && { priority }),
            ...(status && { status }),
            ...(listId !== undefined && { listId })
        };

        // If completing task, update status and newTask flag
        if (completed !== undefined) {
            updateData.completed = completed;
            updateData.newTask = false;

            if (completed) {
                updateData.status = 'completed';
                updateData.completedAt = new Date();

                // 🎉 Celebrate task completion
                await celebrateTaskCompletion(userId, existingTask.taskName, id);

                // Update user's daily task streak
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const streak = await prisma.streak.findFirst({
                    where: {
                        userId,
                        streakType: 'daily_tasks'
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
                        await prisma.streak.update({
                            where: { id: streak.id },
                            data: {
                                currentCount: streak.currentCount + 1,
                                lastUpdate: new Date(),
                                longestStreak: Math.max(streak.longestStreak, streak.currentCount + 1)
                            }
                        });
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
                }
            } else if (status !== 'completed') {
                updateData.completedAt = undefined;
                updateData.status = status as TaskStatus;
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                board: {
                    select: { id: true, name: true, type: true }
                },
                list: {
                    select: { id: true, name: true }
                },
                steps: {
                    orderBy: { orderIndex: 'asc' }
                },
                _count: {
                    select: { steps: true, notes: true }
                }
            }
        });

        res.json({
            message: completed ? 'Task completed! Great job! 🎉' : 'Task updated successfully! ✨',
            task: updatedTask
        });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            error: 'Failed to update task',
            message: 'Internal server error'
        });
    }
};

// Delete task
export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingTask) {
            res.status(404).json({
                error: 'Task not found',
                message: 'Task not found or you do not have access to it'
            });
            return;
        }

        await prisma.task.delete({
            where: { id }
        });

        res.json({
            message: 'Task deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            error: 'Failed to delete task',
            message: 'Internal server error'
        });
    }
};

// Add step to task
export const addTaskStep = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;
        const { description, orderIndex } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if task exists and belongs to user
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

        // If no orderIndex provided, set it to the highest + 1
        let finalOrderIndex = orderIndex;
        if (finalOrderIndex === undefined) {
            const lastStep = await prisma.taskStep.findFirst({
                where: { taskId },
                orderBy: { orderIndex: 'desc' }
            });
            finalOrderIndex = (lastStep?.orderIndex ?? -1) + 1;
        }

        const step = await prisma.taskStep.create({
            data: {
                description,
                orderIndex: finalOrderIndex,
                taskId
            }
        });

        res.status(201).json({
            message: 'Task step added successfully! 📝',
            step
        });

    } catch (error) {
        console.error('Add task step error:', error);
        res.status(500).json({
            error: 'Failed to add task step',
            message: 'Internal server error'
        });
    }
};

// Update task step
export const updateTaskStep = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { description, completed, orderIndex } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if step exists and user has access
        const existingStep = await prisma.taskStep.findFirst({
            where: {
                id,
                task: {
                    userId
                }
            }
        });

        if (!existingStep) {
            res.status(404).json({
                error: 'Task step not found',
                message: 'Task step not found or you do not have access to it'
            });
            return;
        }

        const updatedStep = await prisma.taskStep.update({
            where: { id },
            data: {
                ...(description && { description }),
                ...(completed !== undefined && { completed }),
                ...(orderIndex !== undefined && { orderIndex })
            }
        });

        res.json({
            message: 'Task step updated successfully! ✅',
            step: updatedStep
        });

    } catch (error) {
        console.error('Update task step error:', error);
        res.status(500).json({
            error: 'Failed to update task step',
            message: 'Internal server error'
        });
    }
};

// Delete task step
export const deleteTaskStep = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if step exists and user has access
        const existingStep = await prisma.taskStep.findFirst({
            where: {
                id,
                task: {
                    userId
                }
            }
        });

        if (!existingStep) {
            res.status(404).json({
                error: 'Task step not found',
                message: 'Task step not found or you do not have access to it'
            });
            return;
        }

        await prisma.taskStep.delete({
            where: { id }
        });

        res.json({
            message: 'Task step deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete task step error:', error);
        res.status(500).json({
            error: 'Failed to delete task step',
            message: 'Internal server error'
        });
    }
};

// Get today's tasks
export const getTodayTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const [dueTasks, newTasks, overdueTasks, completedToday] = await Promise.all([
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
                    _count: { select: { steps: true } }
                },
                orderBy: { dueTime: 'asc' }
            }),
            // New tasks (created today or marked as new)
            prisma.task.findMany({
                where: {
                    userId,
                    newTask: true,
                    completed: false
                },
                include: {
                    board: { select: { id: true, name: true, type: true } },
                    list: { select: { id: true, name: true } },
                    _count: { select: { steps: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            // ADD THIS: Overdue tasks (not completed, due before today)
            prisma.task.findMany({
                where: {
                    userId,
                    completed: false,
                    dueTime: {
                        lt: startOfDay  // Due before today
                    }
                },
                include: {
                    board: { select: { id: true, name: true, type: true } },
                    list: { select: { id: true, name: true } },
                    _count: { select: { steps: true } }
                },
                orderBy: { dueTime: 'asc' }, // Show oldest overdue first
                take: 15 // Limit to prevent overwhelming the user
            }),
            // Tasks completed today (that were also due today)
            prisma.task.count({
                where: {
                    userId,
                    completed: true,
                    dueTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            })
        ]);

        res.json({
            message: 'Today\'s tasks retrieved successfully',
            data: {
                dueTasks,
                newTasks,
                overdueTasks,
                completedToday,
                summary: {
                    totalDue: dueTasks.length,
                    totalNew: newTasks.length,
                    totalOverdue: overdueTasks.length, // ADD THIS
                    totalCompleted: completedToday
                }
            }
        });
    } catch (error) {
        console.error('Get today tasks error:', error);
        res.status(500).json({
            error: 'Failed to retrieve today\'s tasks',
            message: 'Internal server error'
        });
    }
};