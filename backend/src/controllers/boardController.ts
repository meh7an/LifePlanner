import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
} from '../types';

// Get all boards for authenticated user
export const getBoards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { includeArchived = 'false' } = req.query;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const boards = await prisma.board.findMany({
            where: {
                userId,
                ...(includeArchived !== 'true' && { isArchived: false })
            },
            include: {
                lists: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        _count: {
                            select: { tasks: true }
                        }
                    }
                },
                _count: {
                    select: {
                        tasks: true,
                        lists: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            message: 'Boards retrieved successfully',
            boards,
            count: boards.length
        });

    } catch (error) {
        console.error('Get boards error:', error);
        res.status(500).json({
            error: 'Failed to retrieve boards',
            message: 'Internal server error'
        });
    }
};

// Get single board by ID
export const getBoard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const board = await prisma.board.findFirst({
            where: {
                id,
                userId
            },
            include: {
                lists: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { createdAt: 'desc' },
                            include: {
                                steps: {
                                    orderBy: { orderIndex: 'asc' }
                                },
                                _count: {
                                    select: { steps: true, notes: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        tasks: true,
                        lists: true
                    }
                }
            }
        });

        if (!board) {
            res.status(404).json({
                error: 'Board not found',
                message: 'Board not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Board retrieved successfully',
            board
        });

    } catch (error) {
        console.error('Get board error:', error);
        res.status(500).json({
            error: 'Failed to retrieve board',
            message: 'Internal server error'
        });
    }
};

// Create new board
export const createBoard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, type } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const board = await prisma.board.create({
            data: {
                name,
                type,
                userId
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                        lists: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Board created successfully! 🎉',
            board
        });

    } catch (error) {
        console.error('Create board error:', error);
        res.status(500).json({
            error: 'Failed to create board',
            message: 'Internal server error'
        });
    }
};

// Update board
export const updateBoard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, type, isArchived } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if board exists and belongs to user
        const existingBoard = await prisma.board.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingBoard) {
            res.status(404).json({
                error: 'Board not found',
                message: 'Board not found or you do not have access to it'
            });
            return;
        }

        const updatedBoard = await prisma.board.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(isArchived !== undefined && { isArchived })
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                        lists: true
                    }
                }
            }
        });

        res.json({
            message: 'Board updated successfully! ✨',
            board: updatedBoard
        });

    } catch (error) {
        console.error('Update board error:', error);
        res.status(500).json({
            error: 'Failed to update board',
            message: 'Internal server error'
        });
    }
};

// Delete board (soft delete by archiving)
export const deleteBoard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { permanent = 'false' } = req.query;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if board exists and belongs to user
        const existingBoard = await prisma.board.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingBoard) {
            res.status(404).json({
                error: 'Board not found',
                message: 'Board not found or you do not have access to it'
            });
            return;
        }

        if (permanent === 'true') {
            // Permanent deletion
            await prisma.board.delete({
                where: { id }
            });

            res.json({
                message: 'Board permanently deleted! 🗑️'
            });
        } else {
            // Soft delete (archive)
            const archivedBoard = await prisma.board.update({
                where: { id },
                data: { isArchived: true }
            });

            res.json({
                message: 'Board archived successfully! 📦',
                board: archivedBoard
            });
        }

    } catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({
            error: 'Failed to delete board',
            message: 'Internal server error'
        });
    }
};

// Create list in board
export const createList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { boardId } = req.params;
        const { name, orderIndex } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if board exists and belongs to user
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

        // If no orderIndex provided, set it to the highest + 1
        let finalOrderIndex = orderIndex;
        if (finalOrderIndex === undefined) {
            const lastList = await prisma.list.findFirst({
                where: { boardId },
                orderBy: { orderIndex: 'desc' }
            });
            finalOrderIndex = (lastList?.orderIndex ?? -1) + 1;
        }

        const list = await prisma.list.create({
            data: {
                name,
                orderIndex: finalOrderIndex,
                boardId
            },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        res.status(201).json({
            message: 'List created successfully! 📋',
            list
        });

    } catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({
            error: 'Failed to create list',
            message: 'Internal server error'
        });
    }
};

// Update list
export const updateList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, orderIndex } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if list exists and user has access
        const existingList = await prisma.list.findFirst({
            where: {
                id,
                board: {
                    userId
                }
            }
        });

        if (!existingList) {
            res.status(404).json({
                error: 'List not found',
                message: 'List not found or you do not have access to it'
            });
            return;
        }

        const updatedList = await prisma.list.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(orderIndex !== undefined && { orderIndex })
            },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        res.json({
            message: 'List updated successfully! ✨',
            list: updatedList
        });

    } catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({
            error: 'Failed to update list',
            message: 'Internal server error'
        });
    }
};

// Delete list
export const deleteList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if list exists and user has access
        const existingList = await prisma.list.findFirst({
            where: {
                id,
                board: {
                    userId
                }
            },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        if (!existingList) {
            res.status(404).json({
                error: 'List not found',
                message: 'List not found or you do not have access to it'
            });
            return;
        }

        // Check if list has tasks
        if (existingList._count.tasks > 0) {
            res.status(400).json({
                error: 'Cannot delete list',
                message: 'List contains tasks. Please move or delete tasks first.'
            });
            return;
        }

        await prisma.list.delete({
            where: { id }
        });

        res.json({
            message: 'List deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({
            error: 'Failed to delete list',
            message: 'Internal server error'
        });
    }
};

// Get board statistics
export const getBoardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if board exists and belongs to user
        const board = await prisma.board.findFirst({
            where: {
                id,
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

        // Get comprehensive stats
        const [totalTasks, completedTasks, highPriorityTasks, overdueTasks] = await Promise.all([
            prisma.task.count({
                where: { boardId: id }
            }),
            prisma.task.count({
                where: { boardId: id, completed: true }
            }),
            prisma.task.count({
                where: { boardId: id, priority: 'high' }
            }),
            prisma.task.count({
                where: {
                    boardId: id,
                    completed: false,
                    dueTime: {
                        lt: new Date()
                    }
                }
            })
        ]);

        const stats = {
            totalTasks,
            completedTasks,
            pendingTasks: totalTasks - completedTasks,
            highPriorityTasks,
            overdueTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };

        res.json({
            message: 'Board statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get board stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve board statistics',
            message: 'Internal server error'
        });
    }
};