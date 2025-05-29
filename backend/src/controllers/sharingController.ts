import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    Share,
    ShareResourceType,
    PermissionLevel,
    ApiResponse,
    PaginatedResponse
} from '../types';
import { notifyShareReceived } from './notificationsController';

// Share a resource (board, task, or calendar) with another user
export const shareResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { resourceType, resourceId, sharedWithUserId, permissionLevel } = req.body as {
            resourceType: ShareResourceType;
            resourceId: string;
            sharedWithUserId: string;
            permissionLevel: PermissionLevel;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if user is trying to share with themselves
        if (userId === sharedWithUserId) {
            res.status(400).json({
                error: 'Invalid sharing request',
                message: 'You cannot share resources with yourself'
            });
            return;
        }

        // Verify the target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: sharedWithUserId },
            select: { id: true, username: true, email: true }
        });

        if (!targetUser) {
            res.status(404).json({
                error: 'User not found',
                message: 'The user you are trying to share with does not exist'
            });
            return;
        }

        // Verify the resource exists and user owns it
        let resourceExists = false;
        let resourceName = '';

        switch (resourceType) {
            case 'board':
                const board = await prisma.board.findFirst({
                    where: { id: resourceId, userId }
                });
                if (board) {
                    resourceExists = true;
                    resourceName = board.name;
                }
                break;
            case 'task':
                const task = await prisma.task.findFirst({
                    where: { id: resourceId, userId }
                });
                if (task) {
                    resourceExists = true;
                    resourceName = task.taskName;
                }
                break;
            case 'calendar':
                const calendar = await prisma.calendar.findFirst({
                    where: { id: resourceId, userId }
                });
                if (calendar) {
                    resourceExists = true;
                    resourceName = calendar.name;
                }
                break;
        }

        if (!resourceExists) {
            res.status(404).json({
                error: 'Resource not found',
                message: `${resourceType} not found or you do not have permission to share it`
            });
            return;
        }

        // Check if resource is already shared with this user
        const existingShare = await prisma.share.findFirst({
            where: {
                resourceType,
                resourceId,
                ownerUserId: userId,
                sharedWithUserId
            }
        });

        if (existingShare) {
            res.status(400).json({
                error: 'Already shared',
                message: `This ${resourceType} is already shared with ${targetUser.username}`
            });
            return;
        }

        // Create the share
        const share = await prisma.share.create({
            data: {
                resourceType,
                resourceId,
                permissionLevel,
                ownerUserId: userId,
                sharedWithUserId
            },
            include: {
                owner: {
                    select: { id: true, username: true, email: true }
                },
                sharedWith: {
                    select: { id: true, username: true, email: true }
                }
            }
        });

        // 🤝 Notify the user about the shared resource
        await notifyShareReceived(sharedWithUserId, resourceType, resourceName, req.user?.username || 'Someone');

        res.status(201).json({
            message: `${resourceType} "${resourceName}" shared successfully with ${targetUser.username}! 🤝`,
            share: {
                ...share,
                resourceName
            }
        });

    } catch (error) {
        console.error('Share resource error:', error);
        res.status(500).json({
            error: 'Failed to share resource',
            message: 'Internal server error'
        });
    }
};

// Get all resources shared by the current user
export const getSharedByMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            resourceType,
            page = '1',
            limit = '20'
        } = req.query as {
            resourceType?: ShareResourceType;
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

        const where = {
            ownerUserId: userId,
            ...(resourceType && { resourceType })
        };

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [shares, totalCount] = await Promise.all([
            prisma.share.findMany({
                where,
                include: {
                    sharedWith: {
                        select: { id: true, username: true, email: true }
                    }
                },
                orderBy: { sharingTimestamp: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.share.count({ where })
        ]);

        // Enrich shares with resource details
        const enrichedShares = await Promise.all(
            shares.map(async (share: any) => {
                let resourceDetails = null;

                switch (share.resourceType) {
                    case 'board':
                        resourceDetails = await prisma.board.findUnique({
                            where: { id: share.resourceId },
                            select: { id: true, name: true, type: true, createdAt: true }
                        });
                        break;
                    case 'task':
                        resourceDetails = await prisma.task.findUnique({
                            where: { id: share.resourceId },
                            select: {
                                id: true,
                                taskName: true,
                                priority: true,
                                completed: true,
                                board: { select: { name: true } }
                            }
                        });
                        break;
                    case 'calendar':
                        resourceDetails = await prisma.calendar.findUnique({
                            where: { id: share.resourceId },
                            select: { id: true, name: true }
                        });
                        break;
                }

                return {
                    ...share,
                    resourceDetails
                };
            })
        );

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Shared resources retrieved successfully',
            shares: enrichedShares,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get shared by me error:', error);
        res.status(500).json({
            error: 'Failed to retrieve shared resources',
            message: 'Internal server error'
        });
    }
};

// Get all resources shared with the current user
export const getSharedWithMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            resourceType,
            permissionLevel,
            page = '1',
            limit = '20'
        } = req.query as {
            resourceType?: ShareResourceType;
            permissionLevel?: PermissionLevel;
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

        const where = {
            sharedWithUserId: userId,
            ...(resourceType && { resourceType }),
            ...(permissionLevel && { permissionLevel })
        };

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [shares, totalCount] = await Promise.all([
            prisma.share.findMany({
                where,
                include: {
                    owner: {
                        select: { id: true, username: true, email: true }
                    }
                },
                orderBy: { sharingTimestamp: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.share.count({ where })
        ]);

        // Enrich shares with resource details
        const enrichedShares = await Promise.all(
            shares.map(async (share: any) => {
                let resourceDetails = null;

                switch (share.resourceType) {
                    case 'board':
                        resourceDetails = await prisma.board.findUnique({
                            where: { id: share.resourceId },
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                createdAt: true,
                                _count: {
                                    select: { tasks: true, lists: true }
                                }
                            }
                        });
                        break;
                    case 'task':
                        resourceDetails = await prisma.task.findUnique({
                            where: { id: share.resourceId },
                            select: {
                                id: true,
                                taskName: true,
                                description: true,
                                priority: true,
                                completed: true,
                                dueTime: true,
                                board: { select: { name: true } },
                                _count: { select: { steps: true, notes: true } }
                            }
                        });
                        break;
                    case 'calendar':
                        resourceDetails = await prisma.calendar.findUnique({
                            where: { id: share.resourceId },
                            select: {
                                id: true,
                                name: true,
                                _count: { select: { events: true } }
                            }
                        });
                        break;
                }

                return {
                    ...share,
                    resourceDetails
                };
            })
        );

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Resources shared with you retrieved successfully',
            shares: enrichedShares,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get shared with me error:', error);
        res.status(500).json({
            error: 'Failed to retrieve shared resources',
            message: 'Internal server error'
        });
    }
};

// Update sharing permissions
export const updateSharePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { permissionLevel } = req.body as { permissionLevel: PermissionLevel };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Find the share and verify ownership
        const existingShare = await prisma.share.findFirst({
            where: {
                id,
                ownerUserId: userId
            },
            include: {
                sharedWith: {
                    select: { username: true }
                }
            }
        });

        if (!existingShare) {
            res.status(404).json({
                error: 'Share not found',
                message: 'Share not found or you do not have permission to modify it'
            });
            return;
        }

        const updatedShare = await prisma.share.update({
            where: { id },
            data: { permissionLevel },
            include: {
                owner: {
                    select: { id: true, username: true, email: true }
                },
                sharedWith: {
                    select: { id: true, username: true, email: true }
                }
            }
        });

        res.json({
            message: `Permissions updated successfully! ${existingShare.sharedWith.username} now has ${permissionLevel} access. ✨`,
            share: updatedShare
        });

    } catch (error) {
        console.error('Update share permissions error:', error);
        res.status(500).json({
            error: 'Failed to update share permissions',
            message: 'Internal server error'
        });
    }
};

// Remove/revoke sharing
export const removeShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Find the share and verify ownership
        const existingShare = await prisma.share.findFirst({
            where: {
                id,
                ownerUserId: userId
            },
            include: {
                sharedWith: {
                    select: { username: true }
                }
            }
        });

        if (!existingShare) {
            res.status(404).json({
                error: 'Share not found',
                message: 'Share not found or you do not have permission to remove it'
            });
            return;
        }

        await prisma.share.delete({
            where: { id }
        });

        res.json({
            message: `Sharing removed successfully! ${existingShare.sharedWith.username} no longer has access. 🗑️`
        });

    } catch (error) {
        console.error('Remove share error:', error);
        res.status(500).json({
            error: 'Failed to remove share',
            message: 'Internal server error'
        });
    }
};

// Get sharing statistics
export const getSharingStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            totalSharedByMe,
            totalSharedWithMe,
            sharedByType,
            sharedWithType,
            recentShares,
            topCollaborators
        ] = await Promise.all([
            // Resources I've shared
            prisma.share.count({
                where: { ownerUserId: userId }
            }),

            // Resources shared with me
            prisma.share.count({
                where: { sharedWithUserId: userId }
            }),

            // Breakdown by resource type (shared by me)
            prisma.share.groupBy({
                by: ['resourceType'],
                where: { ownerUserId: userId },
                _count: { id: true }
            }),

            // Breakdown by resource type (shared with me)
            prisma.share.groupBy({
                by: ['resourceType'],
                where: { sharedWithUserId: userId },
                _count: { id: true }
            }),

            // Recent sharing activity
            prisma.share.findMany({
                where: {
                    OR: [
                        { ownerUserId: userId },
                        { sharedWithUserId: userId }
                    ]
                },
                include: {
                    owner: { select: { username: true } },
                    sharedWith: { select: { username: true } }
                },
                orderBy: { sharingTimestamp: 'desc' },
                take: 5
            }),

            // Top collaborators (people I share with most)
            prisma.share.groupBy({
                by: ['sharedWithUserId'],
                where: { ownerUserId: userId },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            })
        ]);

        // Get collaborator details
        const collaboratorDetails = await Promise.all(
            topCollaborators.map(async (collab: { sharedWithUserId: string; _count: { id: number } }) => {
                const user = await prisma.user.findUnique({
                    where: { id: collab.sharedWithUserId },
                    select: { id: true, username: true, email: true }
                });
                return {
                    user,
                    shareCount: collab._count.id
                };
            })
        );

        const stats = {
            overview: {
                totalSharedByMe,
                totalSharedWithMe,
                totalCollaborations: totalSharedByMe + totalSharedWithMe
            },
            breakdown: {
                sharedByMe: sharedByType.reduce((acc: Record<string, number>, item: { resourceType: string; _count: { id: number } }) => {
                    acc[item.resourceType] = item._count.id;
                    return acc;
                }, {} as Record<string, number>),
                sharedWithMe: sharedWithType.reduce((acc: Record<string, number>, item: { resourceType: string; _count: { id: number } }) => {
                    acc[item.resourceType] = item._count.id;
                    return acc;
                }, {} as Record<string, number>)
            },
            recentActivity: recentShares.map((share: any) => ({
                id: share.id,
                resourceType: share.resourceType,
                permissionLevel: share.permissionLevel,
                timestamp: share.sharingTimestamp,
                owner: share.owner.username,
                sharedWith: share.sharedWith.username,
                direction: share.ownerUserId === userId ? 'outgoing' : 'incoming'
            })),
            topCollaborators: collaboratorDetails.filter(c => c.user !== null)
        };

        res.json({
            message: 'Sharing statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get sharing stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve sharing statistics',
            message: 'Internal server error'
        });
    }
};

// Find users to share with (search by username/email)
export const findUsersToShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { query, limit = '10' } = req.query as { query?: string; limit?: string };

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

        const limitNum = parseInt(limit);

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } }, // Exclude current user
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                status: true
            },
            take: limitNum
        });

        res.json({
            message: 'Users found successfully',
            users,
            count: users.length
        });

    } catch (error) {
        console.error('Find users to share error:', error);
        res.status(500).json({
            error: 'Failed to find users',
            message: 'Internal server error'
        });
    }
};