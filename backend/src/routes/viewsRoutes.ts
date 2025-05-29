import express from 'express';
import {
    getUserViews,
    getView,
    createView,
    updateView,
    deleteView,
    setDefaultView,
    duplicateView,
    getViewTemplates,
    applyViewTemplate,
    getViewStats
} from '../controllers/viewsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All view routes require authentication
router.use(authenticate);

// View validation schemas
const viewPreferencesSchema = z.object({
    layout: z.enum(['grid', 'list', 'kanban', 'calendar']).optional(),
    columns: z.number().int().min(1).max(6).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    filters: z.object({
        priority: z.array(z.string()).optional(),
        status: z.array(z.string()).optional(),
        boardId: z.string().optional(),
        dateRange: z.object({
            start: z.string(),
            end: z.string()
        }).optional()
    }).optional(),
    widgets: z.array(z.object({
        id: z.string(),
        type: z.enum(['tasks', 'calendar', 'focus', 'notes', 'stats']),
        position: z.object({
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number()
        }),
        config: z.record(z.any()).optional()
    })).optional(),
    theme: z.object({
        colorScheme: z.enum(['light', 'dark', 'auto']).optional(),
        accentColor: z.string().optional(),
        compact: z.boolean().optional()
    }).optional()
});

const createViewSchema = z.object({
    viewType: z.enum(['dashboard', 'tasks_board', 'tasks_list', 'calendar_month', 'calendar_week', 'focus_mode', 'analytics', 'custom']),
    name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    defaultStatus: z.boolean().optional().default(false),
    viewPreferences: viewPreferencesSchema.optional().default({})
});

const updateViewSchema = z.object({
    name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    defaultStatus: z.boolean().optional(),
    viewPreferences: viewPreferencesSchema.optional()
});

const getUserViewsSchema = z.object({
    viewType: z.enum(['dashboard', 'tasks_board', 'tasks_list', 'calendar_month', 'calendar_week', 'focus_mode', 'analytics', 'custom']).optional(),
    defaultOnly: z.string().optional().transform((val) => val === 'true' ? 'true' : 'false')
}).merge(paginationSchema);

const duplicateViewSchema = z.object({
    name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters').optional()
});

const applyTemplateSchema = z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters').optional(),
    setAsDefault: z.boolean().optional().default(false)
});

// View routes
router.get('/', validate(getUserViewsSchema), getUserViews);
router.get('/stats', getViewStats);
router.get('/templates', getViewTemplates);
router.post('/apply-template', validate(applyTemplateSchema), applyViewTemplate);
router.get('/:id', validate(idSchema), getView);
router.post('/', validate(createViewSchema), createView);
router.put('/:id', validate(idSchema.merge(updateViewSchema)), updateView);
router.delete('/:id', validate(idSchema), deleteView);
router.put('/:id/default', validate(idSchema), setDefaultView);
router.post('/:id/duplicate', validate(idSchema.merge(duplicateViewSchema)), duplicateView);

export default router;