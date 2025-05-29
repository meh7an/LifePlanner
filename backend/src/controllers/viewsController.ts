import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    ApiResponse,
    PaginatedResponse,
    WhereClause
} from '../types';

// Custom View interfaces
export interface ViewPreferences {
    layout?: 'grid' | 'list' | 'kanban' | 'calendar';
    columns?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
        priority?: string[];
        status?: string[];
        boardId?: string;
        dateRange?: {
            start: string;
            end: string;
        };
    };
    widgets?: Array<{
        id: string;
        type: 'tasks' | 'calendar' | 'focus' | 'notes' | 'stats';
        position: { x: number; y: number; w: number; h: number };
        config?: Record<string, any>;
    }>;
    theme?: {
        colorScheme?: 'light' | 'dark' | 'auto';
        accentColor?: string;
        compact?: boolean;
    };
}

export type ViewType =
    | 'dashboard'
    | 'tasks_board'
    | 'tasks_list'
    | 'calendar_month'
    | 'calendar_week'
    | 'focus_mode'
    | 'analytics'
    | 'custom';

// Get all views for authenticated user
export const getUserViews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            viewType,
            defaultOnly = 'false',
            page = '1',
            limit = '20'
        } = req.query as {
            viewType?: ViewType;
            defaultOnly?: string;
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
        const where: WhereClause = { userId };

        if (viewType) where.viewType = viewType;
        if (defaultOnly === 'true') where.defaultStatus = true;

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [views, totalCount] = await Promise.all([
            prisma.view.findMany({
                where,
                orderBy: [
                    { defaultStatus: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limitNum
            }),
            prisma.view.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'User views retrieved successfully',
            views,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get user views error:', error);
        res.status(500).json({
            error: 'Failed to retrieve user views',
            message: 'Internal server error'
        });
    }
};

// Get single view by ID
export const getView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const view = await prisma.view.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!view) {
            res.status(404).json({
                error: 'View not found',
                message: 'View not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'View retrieved successfully',
            view
        });

    } catch (error) {
        console.error('Get view error:', error);
        res.status(500).json({
            error: 'Failed to retrieve view',
            message: 'Internal server error'
        });
    }
};

// Create new custom view
export const createView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            viewType,
            name,
            description,
            defaultStatus = false,
            viewPreferences = {}
        } = req.body as {
            viewType: ViewType;
            name: string;
            description?: string;
            defaultStatus?: boolean;
            viewPreferences?: ViewPreferences;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Validate view preferences structure
        if (!isValidViewPreferences(viewPreferences)) {
            res.status(400).json({
                error: 'Invalid view preferences',
                message: 'View preferences contain invalid structure or values'
            });
            return;
        }

        // If setting as default, unset other defaults for this view type
        if (defaultStatus) {
            await prisma.view.updateMany({
                where: {
                    userId,
                    viewType,
                    defaultStatus: true
                },
                data: {
                    defaultStatus: false
                }
            });
        }

        const view = await prisma.view.create({
            data: {
                viewType,
                name,
                description,
                defaultStatus,
                viewPreferences,
                userId
            }
        });

        res.status(201).json({
            message: `Custom view "${name}" created successfully! 🎨`,
            view
        });

    } catch (error) {
        console.error('Create view error:', error);
        res.status(500).json({
            error: 'Failed to create view',
            message: 'Internal server error'
        });
    }
};

// Update view
export const updateView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const {
            name,
            description,
            defaultStatus,
            viewPreferences
        } = req.body as {
            name?: string;
            description?: string;
            defaultStatus?: boolean;
            viewPreferences?: ViewPreferences;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if view exists and belongs to user
        const existingView = await prisma.view.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingView) {
            res.status(404).json({
                error: 'View not found',
                message: 'View not found or you do not have access to it'
            });
            return;
        }

        // Validate view preferences if provided
        if (viewPreferences && !isValidViewPreferences(viewPreferences)) {
            res.status(400).json({
                error: 'Invalid view preferences',
                message: 'View preferences contain invalid structure or values'
            });
            return;
        }

        // If setting as default, unset other defaults for this view type
        if (defaultStatus && !existingView.defaultStatus) {
            await prisma.view.updateMany({
                where: {
                    userId,
                    viewType: existingView.viewType,
                    defaultStatus: true
                },
                data: {
                    defaultStatus: false
                }
            });
        }

        const updatedView = await prisma.view.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(defaultStatus !== undefined && { defaultStatus }),
                ...(viewPreferences && { viewPreferences })
            }
        });

        res.json({
            message: `View "${existingView.name}" updated successfully! ✨`,
            view: updatedView
        });

    } catch (error) {
        console.error('Update view error:', error);
        res.status(500).json({
            error: 'Failed to update view',
            message: 'Internal server error'
        });
    }
};

// Delete view
export const deleteView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if view exists and belongs to user
        const existingView = await prisma.view.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingView) {
            res.status(404).json({
                error: 'View not found',
                message: 'View not found or you do not have access to it'
            });
            return;
        }

        await prisma.view.delete({
            where: { id }
        });

        res.json({
            message: `View "${existingView.name}" deleted successfully! 🗑️`
        });

    } catch (error) {
        console.error('Delete view error:', error);
        res.status(500).json({
            error: 'Failed to delete view',
            message: 'Internal server error'
        });
    }
};

// Set view as default
export const setDefaultView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Check if view exists and belongs to user
        const existingView = await prisma.view.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingView) {
            res.status(404).json({
                error: 'View not found',
                message: 'View not found or you do not have access to it'
            });
            return;
        }

        // Unset other defaults for this view type
        await prisma.view.updateMany({
            where: {
                userId,
                viewType: existingView.viewType,
                defaultStatus: true
            },
            data: {
                defaultStatus: false
            }
        });

        // Set this view as default
        const updatedView = await prisma.view.update({
            where: { id },
            data: {
                defaultStatus: true
            }
        });

        res.json({
            message: `"${existingView.name}" is now your default ${existingView.viewType} view! ⭐`,
            view: updatedView
        });

    } catch (error) {
        console.error('Set default view error:', error);
        res.status(500).json({
            error: 'Failed to set default view',
            message: 'Internal server error'
        });
    }
};

// Duplicate view
export const duplicateView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name } = req.body as { name?: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if view exists and belongs to user
        const existingView = await prisma.view.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingView) {
            res.status(404).json({
                error: 'View not found',
                message: 'View not found or you do not have access to it'
            });
            return;
        }

        const duplicatedView = await prisma.view.create({
            data: {
                viewType: existingView.viewType,
                name: name || `${existingView.name} (Copy)`,
                description: existingView.description,
                defaultStatus: false, // Never set duplicate as default
                viewPreferences: existingView.viewPreferences,
                userId
            }
        });

        res.status(201).json({
            message: `View duplicated successfully! Created "${duplicatedView.name}" 📋`,
            view: duplicatedView
        });

    } catch (error) {
        console.error('Duplicate view error:', error);
        res.status(500).json({
            error: 'Failed to duplicate view',
            message: 'Internal server error'
        });
    }
};

// Get view templates (predefined view configurations)
export const getViewTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const templates = [
            {
                id: 'dashboard_minimal',
                name: 'Minimal Dashboard',
                description: 'Clean dashboard with essential widgets only',
                viewType: 'dashboard' as ViewType,
                viewPreferences: {
                    layout: 'grid',
                    columns: 2,
                    widgets: [
                        { id: 'tasks_today', type: 'tasks', position: { x: 0, y: 0, w: 1, h: 2 } },
                        { id: 'focus_summary', type: 'focus', position: { x: 1, y: 0, w: 1, h: 1 } },
                        { id: 'calendar_upcoming', type: 'calendar', position: { x: 1, y: 1, w: 1, h: 1 } }
                    ],
                    theme: { compact: true }
                }
            },
            {
                id: 'dashboard_comprehensive',
                name: 'Comprehensive Dashboard',
                description: 'Full dashboard with all productivity metrics',
                viewType: 'dashboard' as ViewType,
                viewPreferences: {
                    layout: 'grid',
                    columns: 3,
                    widgets: [
                        { id: 'tasks_overview', type: 'tasks', position: { x: 0, y: 0, w: 2, h: 2 } },
                        { id: 'focus_stats', type: 'focus', position: { x: 2, y: 0, w: 1, h: 1 } },
                        { id: 'calendar_week', type: 'calendar', position: { x: 2, y: 1, w: 1, h: 1 } },
                        { id: 'recent_notes', type: 'notes', position: { x: 0, y: 2, w: 1, h: 1 } },
                        { id: 'productivity_stats', type: 'stats', position: { x: 1, y: 2, w: 2, h: 1 } }
                    ]
                }
            },
            {
                id: 'tasks_kanban',
                name: 'Kanban Board',
                description: 'Task management in kanban style',
                viewType: 'tasks_board' as ViewType,
                viewPreferences: {
                    layout: 'kanban',
                    sortBy: 'priority',
                    sortOrder: 'desc',
                    filters: {
                        status: ['todo', 'in_progress', 'done']
                    }
                }
            },
            {
                id: 'focus_mode',
                name: 'Focus Mode',
                description: 'Distraction-free environment for deep work',
                viewType: 'focus_mode' as ViewType,
                viewPreferences: {
                    layout: 'list',
                    theme: {
                        colorScheme: 'dark',
                        compact: true
                    },
                    widgets: [
                        { id: 'active_task', type: 'tasks', position: { x: 0, y: 0, w: 1, h: 1 } },
                        { id: 'focus_timer', type: 'focus', position: { x: 0, y: 1, w: 1, h: 1 } }
                    ]
                }
            },
            {
                id: 'analytics_detailed',
                name: 'Detailed Analytics',
                description: 'Comprehensive productivity analytics and insights',
                viewType: 'analytics' as ViewType,
                viewPreferences: {
                    layout: 'grid',
                    columns: 2,
                    widgets: [
                        { id: 'productivity_trends', type: 'stats', position: { x: 0, y: 0, w: 2, h: 1 } },
                        { id: 'focus_patterns', type: 'focus', position: { x: 0, y: 1, w: 1, h: 1 } },
                        { id: 'task_completion', type: 'tasks', position: { x: 1, y: 1, w: 1, h: 1 } }
                    ]
                }
            }
        ];

        res.json({
            message: 'View templates retrieved successfully',
            templates,
            count: templates.length
        });

    } catch (error) {
        console.error('Get view templates error:', error);
        res.status(500).json({
            error: 'Failed to retrieve view templates',
            message: 'Internal server error'
        });
    }
};

// Apply template to create new view
export const applyViewTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { templateId, name, setAsDefault = false } = req.body as {
            templateId: string;
            name?: string;
            setAsDefault?: boolean;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Get template (this would be from the templates above)
        const templates = await getTemplateById(templateId);

        if (!templates) {
            res.status(404).json({
                error: 'Template not found',
                message: 'The specified template does not exist'
            });
            return;
        }

        // If setting as default, unset other defaults for this view type
        if (setAsDefault) {
            await prisma.view.updateMany({
                where: {
                    userId,
                    viewType: templates.viewType,
                    defaultStatus: true
                },
                data: {
                    defaultStatus: false
                }
            });
        }

        const view = await prisma.view.create({
            data: {
                viewType: templates.viewType,
                name: name || templates.name,
                description: templates.description,
                defaultStatus: setAsDefault,
                viewPreferences: templates.viewPreferences,
                userId
            }
        });

        res.status(201).json({
            message: `View created from template "${templates.name}"! 🎨`,
            view
        });

    } catch (error) {
        console.error('Apply view template error:', error);
        res.status(500).json({
            error: 'Failed to apply view template',
            message: 'Internal server error'
        });
    }
};

// Get view statistics
export const getViewStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const [totalViews, viewsByType, defaultViews] = await Promise.all([
            // Total views
            prisma.view.count({
                where: { userId }
            }),

            // Group by view type
            prisma.view.groupBy({
                by: ['viewType'],
                where: { userId },
                _count: { id: true }
            }),

            // Default views
            prisma.view.count({
                where: { userId, defaultStatus: true }
            })
        ]);

        const stats = {
            overview: {
                totalViews,
                defaultViews,
                customViews: totalViews - defaultViews
            },
            breakdown: viewsByType.reduce((acc: any, item: any) => {
                acc[item.viewType] = item._count.id;
                return acc;
            }, {}),
            mostUsedType: viewsByType.reduce(
                (max: any, item: any) => item._count.id > max.count ? { type: item.viewType, count: item._count.id } : max,
                { type: 'none', count: 0 }
            )
        };

        res.json({
            message: 'View statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get view stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve view statistics',
            message: 'Internal server error'
        });
    }
};

// Helper function to validate view preferences
function isValidViewPreferences(preferences: ViewPreferences): boolean {
    try {
        // Basic structure validation
        if (typeof preferences !== 'object') return false;

        // Validate layout
        if (preferences.layout && !['grid', 'list', 'kanban', 'calendar'].includes(preferences.layout)) {
            return false;
        }

        // Validate columns
        if (preferences.columns && (preferences.columns < 1 || preferences.columns > 6)) {
            return false;
        }

        // Validate widgets
        if (preferences.widgets) {
            if (!Array.isArray(preferences.widgets)) return false;

            for (const widget of preferences.widgets) {
                if (!widget.id || !widget.type || !widget.position) return false;
                if (!['tasks', 'calendar', 'focus', 'notes', 'stats'].includes(widget.type)) return false;

                const { x, y, w, h } = widget.position;
                if (typeof x !== 'number' || typeof y !== 'number' ||
                    typeof w !== 'number' || typeof h !== 'number') return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

// Helper function to get template by ID
async function getTemplateById(templateId: string): Promise<any> {
    const templates = {
        'dashboard_minimal': {
            name: 'Minimal Dashboard',
            description: 'Clean dashboard with essential widgets only',
            viewType: 'dashboard' as ViewType,
            viewPreferences: {
                layout: 'grid',
                columns: 2,
                widgets: [
                    { id: 'tasks_today', type: 'tasks', position: { x: 0, y: 0, w: 1, h: 2 } },
                    { id: 'focus_summary', type: 'focus', position: { x: 1, y: 0, w: 1, h: 1 } },
                    { id: 'calendar_upcoming', type: 'calendar', position: { x: 1, y: 1, w: 1, h: 1 } }
                ],
                theme: { compact: true }
            }
        },
        'dashboard_comprehensive': {
            name: 'Comprehensive Dashboard',
            description: 'Full dashboard with all productivity metrics',
            viewType: 'dashboard' as ViewType,
            viewPreferences: {
                layout: 'grid',
                columns: 3,
                widgets: [
                    { id: 'tasks_overview', type: 'tasks', position: { x: 0, y: 0, w: 2, h: 2 } },
                    { id: 'focus_stats', type: 'focus', position: { x: 2, y: 0, w: 1, h: 1 } },
                    { id: 'calendar_week', type: 'calendar', position: { x: 2, y: 1, w: 1, h: 1 } },
                    { id: 'recent_notes', type: 'notes', position: { x: 0, y: 2, w: 1, h: 1 } },
                    { id: 'productivity_stats', type: 'stats', position: { x: 1, y: 2, w: 2, h: 1 } }
                ]
            }
        },
        'tasks_kanban': {
            name: 'Kanban Board',
            description: 'Task management in kanban style',
            viewType: 'tasks_board' as ViewType,
            viewPreferences: {
                layout: 'kanban',
                sortBy: 'priority',
                sortOrder: 'desc',
                filters: {
                    status: ['todo', 'in_progress', 'done']
                }
            }
        },
        'focus_mode': {
            name: 'Focus Mode',
            description: 'Distraction-free environment for deep work',
            viewType: 'focus_mode' as ViewType,
            viewPreferences: {
                layout: 'list',
                theme: {
                    colorScheme: 'dark',
                    compact: true
                },
                widgets: [
                    { id: 'active_task', type: 'tasks', position: { x: 0, y: 0, w: 1, h: 1 } },
                    { id: 'focus_timer', type: 'focus', position: { x: 0, y: 1, w: 1, h: 1 } }
                ]
            }
        },
        'analytics_detailed': {
            name: 'Detailed Analytics',
            description: 'Comprehensive productivity analytics and insights',
            viewType: 'analytics' as ViewType,
            viewPreferences: {
                layout: 'grid',
                columns: 2,
                widgets: [
                    { id: 'productivity_trends', type: 'stats', position: { x: 0, y: 0, w: 2, h: 1 } },
                    { id: 'focus_patterns', type: 'focus', position: { x: 0, y: 1, w: 1, h: 1 } },
                    { id: 'task_completion', type: 'tasks', position: { x: 1, y: 1, w: 1, h: 1 } }
                ]
            }
        }
    };

    return templates[templateId as keyof typeof templates] || null;
}