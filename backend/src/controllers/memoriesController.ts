import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    ApiResponse,
    PaginatedResponse,
    WhereClause
} from '../types';

// Get all memories for authenticated user
export const getMemories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            tags,
            search,
            startDate,
            endDate,
            page = '1',
            limit = '20',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as {
            tags?: string;
            search?: string;
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
            post: {
                userId
            }
        };

        // Tag filtering
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            where.tags = {
                hasSome: tagArray
            };
        }

        // Search in post title and description
        if (search) {
            where.post = {
                ...where.post,
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ]
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
        const validSortFields = ['createdAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [memories, totalCount] = await Promise.all([
            prisma.memory.findMany({
                where,
                include: {
                    post: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            privacySetting: true,
                            createdAt: true,
                            modifiedAt: true
                        }
                    }
                },
                orderBy: { [sortField]: sortDirection },
                skip,
                take: limitNum
            }),
            prisma.memory.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Memories retrieved successfully',
            memories,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get memories error:', error);
        res.status(500).json({
            error: 'Failed to retrieve memories',
            message: 'Internal server error'
        });
    }
};

// Get single memory by ID
export const getMemory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const memory = await prisma.memory.findFirst({
            where: {
                id,
                post: {
                    userId
                }
            },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        privacySetting: true,
                        createdAt: true,
                        modifiedAt: true
                    }
                }
            }
        });

        if (!memory) {
            res.status(404).json({
                error: 'Memory not found',
                message: 'Memory not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Memory retrieved successfully',
            memory
        });

    } catch (error) {
        console.error('Get memory error:', error);
        res.status(500).json({
            error: 'Failed to retrieve memory',
            message: 'Internal server error'
        });
    }
};

// Update memory (mainly tags)
export const updateMemory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { tags } = req.body as { tags: string[] };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if memory exists and user has access
        const existingMemory = await prisma.memory.findFirst({
            where: {
                id,
                post: {
                    userId
                }
            }
        });

        if (!existingMemory) {
            res.status(404).json({
                error: 'Memory not found',
                message: 'Memory not found or you do not have access to it'
            });
            return;
        }

        const updatedMemory = await prisma.memory.update({
            where: { id },
            data: { tags },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        privacySetting: true,
                        createdAt: true,
                        modifiedAt: true
                    }
                }
            }
        });

        res.json({
            message: 'Memory updated successfully! ✨',
            memory: updatedMemory
        });

    } catch (error) {
        console.error('Update memory error:', error);
        res.status(500).json({
            error: 'Failed to update memory',
            message: 'Internal server error'
        });
    }
};

// Delete memory (convert back to regular post)
export const deleteMemory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if memory exists and user has access
        const existingMemory = await prisma.memory.findFirst({
            where: {
                id,
                post: {
                    userId
                }
            },
            include: {
                post: {
                    select: {
                        title: true
                    }
                }
            }
        });

        if (!existingMemory) {
            res.status(404).json({
                error: 'Memory not found',
                message: 'Memory not found or you do not have access to it'
            });
            return;
        }

        await prisma.memory.delete({
            where: { id }
        });

        res.json({
            message: `Memory "${existingMemory.post.title}" removed successfully! Post is now regular. 🗑️`
        });

    } catch (error) {
        console.error('Delete memory error:', error);
        res.status(500).json({
            error: 'Failed to delete memory',
            message: 'Internal server error'
        });
    }
};

// Get memories by tag
export const getMemoriesByTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { tag } = req.params;
        const { limit = '20' } = req.query as { limit?: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const limitNum = parseInt(limit);

        const memories = await prisma.memory.findMany({
            where: {
                post: { userId },
                tags: {
                    has: tag
                }
            },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        privacySetting: true,
                        createdAt: true,
                        modifiedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum
        });

        res.json({
            message: `Memories tagged with "${tag}" retrieved successfully`,
            tag,
            memories,
            count: memories.length
        });

    } catch (error) {
        console.error('Get memories by tag error:', error);
        res.status(500).json({
            error: 'Failed to retrieve memories by tag',
            message: 'Internal server error'
        });
    }
};

// Get all unique tags for user's memories
export const getMemoryTags = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const memories = await prisma.memory.findMany({
            where: {
                post: { userId }
            },
            select: {
                tags: true
            }
        });

        // Extract and count unique tags
        const tagFrequency: Record<string, number> = {};
        memories.forEach(memory => {
            memory.tags.forEach(tag => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
        });

        // Sort tags by frequency
        const sortedTags = Object.entries(tagFrequency)
            .sort(([, a], [, b]) => b - a)
            .map(([tag, count]) => ({ tag, count }));

        res.json({
            message: 'Memory tags retrieved successfully',
            tags: sortedTags,
            totalUniqueTags: sortedTags.length,
            totalTaggedMemories: memories.length
        });

    } catch (error) {
        console.error('Get memory tags error:', error);
        res.status(500).json({
            error: 'Failed to retrieve memory tags',
            message: 'Internal server error'
        });
    }
};

// Search memories
export const searchMemories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            q: query,
            tags,
            limit = '20'
        } = req.query as {
            q?: string;
            tags?: string;
            limit?: string;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        if (!query && !tags) {
            res.status(400).json({
                error: 'Invalid search parameters',
                message: 'Either search query or tags must be provided'
            });
            return;
        }

        // Build where clause
        const where: WhereClause = {
            post: {
                userId
            }
        };

        if (query && query.trim().length >= 2) {
            where.post = {
                ...where.post,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            };
        }

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            where.tags = {
                hasSome: tagArray
            };
        }

        const limitNum = parseInt(limit);

        const memories = await prisma.memory.findMany({
            where,
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        privacySetting: true,
                        createdAt: true,
                        modifiedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum
        });

        // Highlight search terms if query provided
        const highlightedMemories = query ? memories.map(memory => ({
            ...memory,
            post: {
                ...memory.post,
                highlightedTitle: memory.post.title.replace(
                    new RegExp(`(${query})`, 'gi'),
                    '<mark>$1</mark>'
                ),
                highlightedDescription: memory.post.description?.replace(
                    new RegExp(`(${query})`, 'gi'),
                    '<mark>$1</mark>'
                )
            }
        })) : memories;

        res.json({
            message: 'Memory search completed successfully',
            query,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            memories: highlightedMemories,
            count: memories.length
        });

    } catch (error) {
        console.error('Search memories error:', error);
        res.status(500).json({
            error: 'Failed to search memories',
            message: 'Internal server error'
        });
    }
};

// Get memory statistics
export const getMemoryStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            totalMemories,
            memoriesThisWeek,
            memoriesThisMonth,
            allMemoryTags,
            recentMemories
        ] = await Promise.all([
            // Total memories
            prisma.memory.count({
                where: { post: { userId } }
            }),

            // Memories this week
            prisma.memory.count({
                where: {
                    post: { userId },
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // Memories this month
            prisma.memory.count({
                where: {
                    post: { userId },
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // All tags for analysis
            prisma.memory.findMany({
                where: { post: { userId } },
                select: { tags: true }
            }),

            // Recent memories
            prisma.memory.findMany({
                where: { post: { userId } },
                include: {
                    post: {
                        select: { title: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        // Analyze tags
        const tagFrequency: Record<string, number> = {};
        allMemoryTags.forEach(memory => {
            memory.tags.forEach(tag => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
        });

        const topTags = Object.entries(tagFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        const stats = {
            overview: {
                totalMemories,
                memoriesThisWeek,
                memoriesThisMonth,
                totalUniqueTags: Object.keys(tagFrequency).length
            },
            activity: {
                averagePerWeek: Math.round((memoriesThisWeek || 0) * 100) / 100,
                growthRate: memoriesThisWeek > 0 ? Math.round(((memoriesThisWeek / Math.max(memoriesThisMonth - memoriesThisWeek, 1)) * 100)) : 0
            },
            topTags,
            recentMemories: recentMemories.map(m => ({
                id: m.id,
                title: m.post.title,
                tags: m.tags,
                createdAt: m.createdAt
            }))
        };

        res.json({
            message: 'Memory statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get memory stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve memory statistics',
            message: 'Internal server error'
        });
    }
};