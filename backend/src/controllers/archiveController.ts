import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    WhereClause
} from '../types';

// Get all archives for authenticated user
export const getArchives = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            category,
            search,
            startDate,
            endDate,
            page = '1',
            limit = '20',
            sortBy = 'archiveDate',
            sortOrder = 'desc'
        } = req.query as {
            category?: string;
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

        // Category filtering
        if (category) {
            where.category = {
                contains: category,
                mode: 'insensitive'
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
            where.archiveDate = {};
            if (startDate) where.archiveDate.gte = new Date(startDate);
            if (endDate) where.archiveDate.lte = new Date(endDate);
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Valid sort fields
        const validSortFields = ['archiveDate'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'archiveDate';
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [archives, totalCount] = await Promise.all([
            prisma.archive.findMany({
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
            prisma.archive.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Archives retrieved successfully',
            archives,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get archives error:', error);
        res.status(500).json({
            error: 'Failed to retrieve archives',
            message: 'Internal server error'
        });
    }
};

// Get single archive by ID
export const getArchive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const archive = await prisma.archive.findFirst({
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

        if (!archive) {
            res.status(404).json({
                error: 'Archive not found',
                message: 'Archive not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Archive retrieved successfully',
            archive
        });

    } catch (error) {
        console.error('Get archive error:', error);
        res.status(500).json({
            error: 'Failed to retrieve archive',
            message: 'Internal server error'
        });
    }
};

// Update archive (mainly category)
export const updateArchive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { category } = req.body as { category: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if archive exists and user has access
        const existingArchive = await prisma.archive.findFirst({
            where: {
                id,
                post: {
                    userId
                }
            }
        });

        if (!existingArchive) {
            res.status(404).json({
                error: 'Archive not found',
                message: 'Archive not found or you do not have access to it'
            });
            return;
        }

        const updatedArchive = await prisma.archive.update({
            where: { id },
            data: { category },
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
            message: 'Archive updated successfully! ✨',
            archive: updatedArchive
        });

    } catch (error) {
        console.error('Update archive error:', error);
        res.status(500).json({
            error: 'Failed to update archive',
            message: 'Internal server error'
        });
    }
};

// Unarchive (delete archive, return to regular post)
export const unarchivePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if archive exists and user has access
        const existingArchive = await prisma.archive.findFirst({
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

        if (!existingArchive) {
            res.status(404).json({
                error: 'Archive not found',
                message: 'Archive not found or you do not have access to it'
            });
            return;
        }

        await prisma.archive.delete({
            where: { id }
        });

        res.json({
            message: `"${existingArchive.post.title}" has been unarchived successfully! Post is now active. 📤`
        });

    } catch (error) {
        console.error('Unarchive post error:', error);
        res.status(500).json({
            error: 'Failed to unarchive post',
            message: 'Internal server error'
        });
    }
};

// Get archives by category
export const getArchivesByCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { category } = req.params;
        const { limit = '20' } = req.query as { limit?: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const limitNum = parseInt(limit);

        const archives = await prisma.archive.findMany({
            where: {
                post: { userId },
                category: {
                    contains: category,
                    mode: 'insensitive'
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
            orderBy: { archiveDate: 'desc' },
            take: limitNum
        });

        res.json({
            message: `Archives in category "${category}" retrieved successfully`,
            category,
            archives,
            count: archives.length
        });

    } catch (error) {
        console.error('Get archives by category error:', error);
        res.status(500).json({
            error: 'Failed to retrieve archives by category',
            message: 'Internal server error'
        });
    }
};

// Get all archive categories for user
export const getArchiveCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const archives = await prisma.archive.findMany({
            where: {
                post: { userId }
            },
            select: {
                category: true
            }
        });

        // Count unique categories
        const categoryFrequency: Record<string, number> = {};
        archives.forEach(archive => {
            const category = archive.category.toLowerCase();
            categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        });

        // Sort categories by frequency
        const sortedCategories = Object.entries(categoryFrequency)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => ({ category, count }));

        res.json({
            message: 'Archive categories retrieved successfully',
            categories: sortedCategories,
            totalCategories: sortedCategories.length,
            totalArchivedPosts: archives.length
        });

    } catch (error) {
        console.error('Get archive categories error:', error);
        res.status(500).json({
            error: 'Failed to retrieve archive categories',
            message: 'Internal server error'
        });
    }
};

// Search archives
export const searchArchives = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            q: query,
            category,
            limit = '20'
        } = req.query as {
            q?: string;
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

        if (!query && !category) {
            res.status(400).json({
                error: 'Invalid search parameters',
                message: 'Either search query or category must be provided'
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

        if (category) {
            where.category = {
                contains: category,
                mode: 'insensitive'
            };
        }

        const limitNum = parseInt(limit);

        const archives = await prisma.archive.findMany({
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
            orderBy: { archiveDate: 'desc' },
            take: limitNum
        });

        // Highlight search terms if query provided
        const highlightedArchives = query ? archives.map(archive => ({
            ...archive,
            post: {
                ...archive.post,
                highlightedTitle: archive.post.title.replace(
                    new RegExp(`(${query})`, 'gi'),
                    '<mark>$1</mark>'
                ),
                highlightedDescription: archive.post.description?.replace(
                    new RegExp(`(${query})`, 'gi'),
                    '<mark>$1</mark>'
                )
            }
        })) : archives;

        res.json({
            message: 'Archive search completed successfully',
            query,
            category,
            archives: highlightedArchives,
            count: archives.length
        });

    } catch (error) {
        console.error('Search archives error:', error);
        res.status(500).json({
            error: 'Failed to search archives',
            message: 'Internal server error'
        });
    }
};

// Get archive statistics
export const getArchiveStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            totalArchives,
            archivesThisWeek,
            archivesThisMonth,
            allArchiveCategories,
            recentArchives
        ] = await Promise.all([
            // Total archives
            prisma.archive.count({
                where: { post: { userId } }
            }),

            // Archives this week
            prisma.archive.count({
                where: {
                    post: { userId },
                    archiveDate: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // Archives this month
            prisma.archive.count({
                where: {
                    post: { userId },
                    archiveDate: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // All categories for analysis
            prisma.archive.findMany({
                where: { post: { userId } },
                select: { category: true }
            }),

            // Recent archives
            prisma.archive.findMany({
                where: { post: { userId } },
                include: {
                    post: {
                        select: { title: true }
                    }
                },
                orderBy: { archiveDate: 'desc' },
                take: 5
            })
        ]);

        // Analyze categories
        const categoryFrequency: Record<string, number> = {};
        allArchiveCategories.forEach(archive => {
            const category = archive.category.toLowerCase();
            categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        });

        const topCategories = Object.entries(categoryFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([category, count]) => ({ category, count }));

        const stats = {
            overview: {
                totalArchives,
                archivesThisWeek,
                archivesThisMonth,
                totalCategories: Object.keys(categoryFrequency).length
            },
            activity: {
                averagePerWeek: Math.round((archivesThisWeek || 0) * 100) / 100,
                growthRate: archivesThisWeek > 0 ? Math.round(((archivesThisWeek / Math.max(archivesThisMonth - archivesThisWeek, 1)) * 100)) : 0
            },
            topCategories,
            recentArchives: recentArchives.map(a => ({
                id: a.id,
                title: a.post.title,
                category: a.category,
                archiveDate: a.archiveDate
            }))
        };

        res.json({
            message: 'Archive statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get archive stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve archive statistics',
            message: 'Internal server error'
        });
    }
};

// Bulk operations
export const bulkArchiveByCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { sourceCategory, targetCategory } = req.body as {
            sourceCategory: string;
            targetCategory: string;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const result = await prisma.archive.updateMany({
            where: {
                post: { userId },
                category: {
                    contains: sourceCategory,
                    mode: 'insensitive'
                }
            },
            data: {
                category: targetCategory
            }
        });

        res.json({
            message: `${result.count} archives moved from "${sourceCategory}" to "${targetCategory}" successfully! 📦`,
            updatedCount: result.count
        });

    } catch (error) {
        console.error('Bulk archive by category error:', error);
        res.status(500).json({
            error: 'Failed to bulk update archives',
            message: 'Internal server error'
        });
    }
};