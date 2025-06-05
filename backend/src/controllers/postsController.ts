import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    PrivacySetting,
    WhereClause
} from '../types';

// Get all posts for authenticated user
export const getPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            privacySetting,
            search,
            tags,
            hasMemory = 'false',
            hasArchive = 'false',
            startDate,
            endDate,
            page = '1',
            limit = '20',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as {
            privacySetting?: PrivacySetting;
            search?: string;
            tags?: string;
            hasMemory?: string;
            hasArchive?: string;
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

        if (privacySetting) where.privacySetting = privacySetting;

        // Search in title and description
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Filter by memory status
        if (hasMemory === 'true') {
            where.memory = { isNot: null };
        } else if (hasMemory === 'false') {
            where.memory = null;
        }

        // Filter by archive status
        if (hasArchive === 'true') {
            where.archive = { isNot: null };
        } else if (hasArchive === 'false') {
            where.archive = null;
        }

        // Date range filtering
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Tag filtering (if memory exists)
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            where.memory = {
                tags: {
                    hasSome: tagArray
                }
            };
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Valid sort fields
        const validSortFields = ['createdAt', 'modifiedAt', 'title'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [posts, totalCount] = await Promise.all([
            prisma.post.findMany({
                where,
                include: {
                    memory: {
                        select: {
                            id: true,
                            createdAt: true,
                            tags: true
                        }
                    },
                    archive: {
                        select: {
                            id: true,
                            archiveDate: true,
                            category: true
                        }
                    }
                },
                orderBy: { [sortField]: sortDirection },
                skip,
                take: limitNum
            }),
            prisma.post.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Posts retrieved successfully',
            posts,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            error: 'Failed to retrieve posts',
            message: 'Internal server error'
        });
    }
};

// Get single post by ID
export const getPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const post = await prisma.post.findFirst({
            where: {
                id,
                userId
            },
            include: {
                memory: {
                    select: {
                        id: true,
                        createdAt: true,
                        tags: true
                    }
                },
                archive: {
                    select: {
                        id: true,
                        archiveDate: true,
                        category: true
                    }
                }
            }
        });

        if (!post) {
            res.status(404).json({
                error: 'Post not found',
                message: 'Post not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Post retrieved successfully',
            post
        });

    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({
            error: 'Failed to retrieve post',
            message: 'Internal server error'
        });
    }
};

// Create new post
export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            title,
            description,
            privacySetting = 'private'
        } = req.body as {
            title: string;
            description?: string;
            privacySetting?: PrivacySetting;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const post = await prisma.post.create({
            data: {
                title,
                description,
                privacySetting,
                userId
            }
        });

        res.status(201).json({
            message: 'Post created successfully! 📝',
            post
        });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            error: 'Failed to create post',
            message: 'Internal server error'
        });
    }
};

// Update post
export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const {
            title,
            description,
            privacySetting
        } = req.body as {
            title?: string;
            description?: string;
            privacySetting?: PrivacySetting;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if post exists and belongs to user
        const existingPost = await prisma.post.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingPost) {
            res.status(404).json({
                error: 'Post not found',
                message: 'Post not found or you do not have access to it'
            });
            return;
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(privacySetting && { privacySetting }),
                modifiedAt: new Date()
            },
            include: {
                memory: {
                    select: {
                        id: true,
                        createdAt: true,
                        tags: true
                    }
                },
                archive: {
                    select: {
                        id: true,
                        archiveDate: true,
                        category: true
                    }
                }
            }
        });

        res.json({
            message: 'Post updated successfully! ✨',
            post: updatedPost
        });

    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({
            error: 'Failed to update post',
            message: 'Internal server error'
        });
    }
};

// Delete post
export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if post exists and belongs to user
        const existingPost = await prisma.post.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingPost) {
            res.status(404).json({
                error: 'Post not found',
                message: 'Post not found or you do not have access to it'
            });
            return;
        }

        await prisma.post.delete({
            where: { id }
        });

        res.json({
            message: 'Post deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            error: 'Failed to delete post',
            message: 'Internal server error'
        });
    }
};

// Convert post to memory
export const createMemoryFromPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { tags = [] } = req.body as { tags?: string[] };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if post exists and belongs to user
        const existingPost = await prisma.post.findFirst({
            where: {
                id,
                userId
            },
            include: {
                memory: true
            }
        });

        if (!existingPost) {
            res.status(404).json({
                error: 'Post not found',
                message: 'Post not found or you do not have access to it'
            });
            return;
        }

        if (existingPost.memory) {
            res.status(400).json({
                error: 'Memory already exists',
                message: 'This post is already saved as a memory'
            });
            return;
        }

        const memory = await prisma.memory.create({
            data: {
                tags,
                postId: id
            },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        createdAt: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Post saved as memory successfully! 💾',
            memory
        });

    } catch (error) {
        console.error('Create memory from post error:', error);
        res.status(500).json({
            error: 'Failed to create memory from post',
            message: 'Internal server error'
        });
    }
};

// Archive post
export const archivePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { category = 'general' } = req.body as { category?: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if post exists and belongs to user
        const existingPost = await prisma.post.findFirst({
            where: {
                id,
                userId
            },
            include: {
                archive: true
            }
        });

        if (!existingPost) {
            res.status(404).json({
                error: 'Post not found',
                message: 'Post not found or you do not have access to it'
            });
            return;
        }

        if (existingPost.archive) {
            res.status(400).json({
                error: 'Post already archived',
                message: 'This post is already archived'
            });
            return;
        }

        const archive = await prisma.archive.create({
            data: {
                category,
                postId: id
            },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        createdAt: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Post archived successfully! 📦',
            archive
        });

    } catch (error) {
        console.error('Archive post error:', error);
        res.status(500).json({
            error: 'Failed to archive post',
            message: 'Internal server error'
        });
    }
};

// Search posts
export const searchPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            q: query,
            privacySetting,
            tags,
            category,
            limit = '20'
        } = req.query as {
            q?: string;
            privacySetting?: PrivacySetting;
            tags?: string;
            category?: string;
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
            userId,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ]
        };

        if (privacySetting) where.privacySetting = privacySetting;

        // Tag filtering
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            where.memory = {
                tags: {
                    hasSome: tagArray
                }
            };
        }

        // Category filtering (for archived posts)
        if (category) {
            where.archive = {
                category: {
                    contains: category,
                    mode: 'insensitive'
                }
            };
        }

        const limitNum = parseInt(limit);

        const posts = await prisma.post.findMany({
            where,
            include: {
                memory: {
                    select: {
                        id: true,
                        tags: true,
                        createdAt: true
                    }
                },
                archive: {
                    select: {
                        id: true,
                        category: true,
                        archiveDate: true
                    }
                }
            },
            orderBy: { modifiedAt: 'desc' },
            take: limitNum
        });

        // Highlight search terms (basic version)
        const highlightedPosts = posts.map(post => ({
            ...post,
            highlightedTitle: post.title.replace(
                new RegExp(`(${query})`, 'gi'),
                '<mark>$1</mark>'
            ),
            highlightedDescription: post.description?.replace(
                new RegExp(`(${query})`, 'gi'),
                '<mark>$1</mark>'
            )
        }));

        res.json({
            message: 'Posts search completed successfully',
            query,
            posts: highlightedPosts,
            count: posts.length
        });

    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({
            error: 'Failed to search posts',
            message: 'Internal server error'
        });
    }
};

// Get recent posts
export const getRecentPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const limitNum = parseInt(limit);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const posts = await prisma.post.findMany({
            where: {
                userId,
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            include: {
                memory: {
                    select: {
                        id: true,
                        tags: true
                    }
                },
                archive: {
                    select: {
                        id: true,
                        category: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum
        });

        res.json({
            message: 'Recent posts retrieved successfully',
            posts,
            count: posts.length,
            period: '7 days'
        });

    } catch (error) {
        console.error('Get recent posts error:', error);
        res.status(500).json({
            error: 'Failed to retrieve recent posts',
            message: 'Internal server error'
        });
    }
};

// Get post statistics
export const getPostStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            totalPosts,
            publicPosts,
            privatePosts,
            memoriesCount,
            archivesCount,
            postsThisWeek,
            postsThisMonth,
            topTags
        ] = await Promise.all([
            // Total posts
            prisma.post.count({
                where: { userId }
            }),

            // Public posts
            prisma.post.count({
                where: { userId, privacySetting: 'public' }
            }),

            // Private posts
            prisma.post.count({
                where: { userId, privacySetting: 'private' }
            }),

            // Posts with memories
            prisma.post.count({
                where: {
                    userId,
                    memory: { isNot: null }
                }
            }),

            // Archived posts
            prisma.post.count({
                where: {
                    userId,
                    archive: { isNot: null }
                }
            }),

            // Posts this week
            prisma.post.count({
                where: {
                    userId,
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // Posts this month
            prisma.post.count({
                where: {
                    userId,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // Get all memories to analyze tags
            prisma.memory.findMany({
                where: {
                    post: { userId }
                },
                select: {
                    tags: true
                }
            })
        ]);

        // Analyze tag frequency
        const tagFrequency: Record<string, number> = {};
        topTags.forEach(memory => {
            memory.tags.forEach(tag => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
        });

        const sortedTags = Object.entries(tagFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        const stats = {
            overview: {
                totalPosts,
                publicPosts,
                privatePosts,
                memoriesCount,
                archivesCount
            },
            activity: {
                postsThisWeek,
                postsThisMonth,
                averagePerWeek: Math.round((postsThisWeek || 0) * 100) / 100
            },
            insights: {
                memoryRate: totalPosts > 0 ? Math.round((memoriesCount / totalPosts) * 100) : 0,
                archiveRate: totalPosts > 0 ? Math.round((archivesCount / totalPosts) * 100) : 0,
                publicRate: totalPosts > 0 ? Math.round((publicPosts / totalPosts) * 100) : 0
            },
            topTags: sortedTags
        };

        res.json({
            message: 'Post statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get post stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve post statistics',
            message: 'Internal server error'
        });
    }
};