import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    NoteWithTask,
    NotesStats,
    TaskPriority,
    WhereClause,
    PaginatedResponse,
    ApiResponse
} from '../types';

// Get all notes for a task
export const getTaskNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;
        const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };

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

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [notes, totalCount] = await Promise.all([
            prisma.note.findMany({
                where: { taskId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.note.count({ where: { taskId } })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Task notes retrieved successfully',
            notes,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get task notes error:', error);
        res.status(500).json({
            error: 'Failed to retrieve task notes',
            message: 'Internal server error'
        });
    }
};

// Get all notes for authenticated user (across all tasks)
export const getAllNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            search,
            boardId,
            taskId,
            startDate,
            endDate,
            page = '1',
            limit = '20',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as {
            search?: string;
            boardId?: string;
            taskId?: string;
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
        const where: WhereClause = {
            task: {
                userId
            }
        };

        if (search) {
            where.content = {
                contains: search,
                mode: 'insensitive'
            };
        }

        if (taskId) where.taskId = taskId;

        if (boardId) {
            where.task = {
                ...where.task,
                boardId
            };
        }

        // Date range filtering
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Valid sort fields
        const validSortFields = ['createdAt', 'modifiedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [notes, totalCount] = await Promise.all([
            prisma.note.findMany({
                where,
                include: {
                    task: {
                        select: {
                            id: true,
                            taskName: true,
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
                orderBy: { [sortField]: sortDirection },
                skip,
                take: limitNum
            }),
            prisma.note.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Notes retrieved successfully',
            notes,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get all notes error:', error);
        res.status(500).json({
            error: 'Failed to retrieve notes',
            message: 'Internal server error'
        });
    }
};

// Get single note by ID
export const getNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const note = await prisma.note.findFirst({
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

        if (!note) {
            res.status(404).json({
                error: 'Note not found',
                message: 'Note not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Note retrieved successfully',
            note
        });

    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({
            error: 'Failed to retrieve note',
            message: 'Internal server error'
        });
    }
};

// Create new note for a task
export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;
        const { content } = req.body as { content: string };

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

        const note = await prisma.note.create({
            data: {
                content,
                taskId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        priority: true,
                        board: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Note created successfully! 📝',
            note
        });

    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({
            error: 'Failed to create note',
            message: 'Internal server error'
        });
    }
};

// Update note
export const updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { content } = req.body as { content: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if note exists and user has access
        const existingNote = await prisma.note.findFirst({
            where: {
                id,
                task: {
                    userId
                }
            }
        });

        if (!existingNote) {
            res.status(404).json({
                error: 'Note not found',
                message: 'Note not found or you do not have access to it'
            });
            return;
        }

        const updatedNote = await prisma.note.update({
            where: { id },
            data: {
                content,
                modifiedAt: new Date()
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        priority: true,
                        board: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        res.json({
            message: 'Note updated successfully! ✨',
            note: updatedNote
        });

    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({
            error: 'Failed to update note',
            message: 'Internal server error'
        });
    }
};

// Delete note
export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if note exists and user has access
        const existingNote = await prisma.note.findFirst({
            where: {
                id,
                task: {
                    userId
                }
            }
        });

        if (!existingNote) {
            res.status(404).json({
                error: 'Note not found',
                message: 'Note not found or you do not have access to it'
            });
            return;
        }

        await prisma.note.delete({
            where: { id }
        });

        res.json({
            message: 'Note deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({
            error: 'Failed to delete note',
            message: 'Internal server error'
        });
    }
};

// Search notes across all tasks
export const searchNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            q: query,
            boardId,
            priority,
            completed,
            limit = '20'
        } = req.query as {
            q?: string;
            boardId?: string;
            priority?: TaskPriority;
            completed?: string;
            limit?: string;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        if (!query || query.trim().length < 2) {
            res.status(400).json({
                error: 'Invalid search query',
                message: 'Search query must be at least 2 characters long'
            });
            return;
        }

        // Build where clause
        const where: WhereClause = {
            task: {
                userId
            },
            content: {
                contains: query,
                mode: 'insensitive'
            }
        };

        if (boardId) {
            where.task = {
                ...where.task,
                boardId
            };
        }

        if (priority) {
            where.task = {
                ...where.task,
                priority
            };
        }

        if (completed !== undefined) {
            where.task = {
                ...where.task,
                completed: completed === 'true'
            };
        }

        const limitNum = parseInt(limit);

        const notes = await prisma.note.findMany({
            where,
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
            },
            orderBy: { modifiedAt: 'desc' },
            take: limitNum
        });

        // Highlight search terms in content (simple version)
        const highlightedNotes = notes.map((note: any) => ({
            ...note,
            highlightedContent: note.content.replace(
                new RegExp(`(${query})`, 'gi'),
                '<mark>$1</mark>'
            )
        }));

        res.json({
            message: 'Notes search completed successfully',
            query,
            notes: highlightedNotes,
            count: notes.length
        });

    } catch (error) {
        console.error('Search notes error:', error);
        res.status(500).json({
            error: 'Failed to search notes',
            message: 'Internal server error'
        });
    }
};

// Get recent notes (last 7 days)
export const getRecentNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { limit = '10' } = req.query as { limit?: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const limitNum = parseInt(limit);

        const notes = await prisma.note.findMany({
            where: {
                task: {
                    userId
                },
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        priority: true,
                        completed: true,
                        board: {
                            select: { id: true, name: true, type: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum
        });

        res.json({
            message: 'Recent notes retrieved successfully',
            notes,
            count: notes.length,
            period: '7 days'
        });

    } catch (error) {
        console.error('Get recent notes error:', error);
        res.status(500).json({
            error: 'Failed to retrieve recent notes',
            message: 'Internal server error'
        });
    }
};

// Get notes statistics
export const getNotesStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const [totalNotes, notesThisWeek, notesThisMonth, notesByBoard] = await Promise.all([
            // Total notes count
            prisma.note.count({
                where: {
                    task: { userId }
                }
            }),

            // Notes this week
            prisma.note.count({
                where: {
                    task: { userId },
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // Notes this month
            prisma.note.count({
                where: {
                    task: { userId },
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // Notes grouped by board
            prisma.note.groupBy({
                by: ['taskId'],
                where: {
                    task: { userId }
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            })
        ]);

        // Get board info for top boards with notes
        const topTasksWithNotes = await Promise.all(
            notesByBoard.map(async (item: any) => {
                const task = await prisma.task.findUnique({
                    where: { id: item.taskId },
                    select: {
                        id: true,
                        taskName: true,
                        board: {
                            select: { id: true, name: true, type: true }
                        }
                    }
                });
                return {
                    task,
                    notesCount: item._count.id
                };
            })
        );

        // Filter out null tasks and ensure proper typing
        const validTopTasks = topTasksWithNotes
            .filter((item): item is { task: NonNullable<typeof item.task>; notesCount: number } => item.task !== null)
            .map(item => ({
                task: item.task,
                notesCount: item.notesCount
            }));

        const stats: NotesStats = {
            totalNotes,
            notesThisWeek,
            notesThisMonth,
            averageNotesPerWeek: Math.round((notesThisWeek || 0) * 100) / 100,
            topTasksWithNotes: validTopTasks,
            growth: {
                weeklyGrowth: notesThisWeek,
                monthlyGrowth: notesThisMonth
            }
        };

        res.json({
            message: 'Notes statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get notes stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve notes statistics',
            message: 'Internal server error'
        });
    }
};