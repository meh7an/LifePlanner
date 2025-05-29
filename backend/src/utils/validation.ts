import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types';

// User validation schemas
export const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase(),
    password: z
        .string()
        .min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .optional(),
    profilePicture: z
        .string()
        .url('Profile picture must be a valid URL')
        .optional()
});

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// Board validation schemas
export const createBoardSchema = z.object({
    name: z
        .string()
        .min(1, 'Board name is required')
        .max(100, 'Board name must be less than 100 characters'),
    type: z
        .string()
        .min(1, 'Board type is required')
        .max(50, 'Board type must be less than 50 characters')
});

export const updateBoardSchema = z.object({
    name: z
        .string()
        .min(1, 'Board name is required')
        .max(100, 'Board name must be less than 100 characters')
        .optional(),
    type: z
        .string()
        .min(1, 'Board type is required')
        .max(50, 'Board type must be less than 50 characters')
        .optional(),
    isArchived: z
        .boolean()
        .optional()
});

// List validation schemas
export const createListSchema = z.object({
    name: z
        .string()
        .min(1, 'List name is required')
        .max(100, 'List name must be less than 100 characters'),
    orderIndex: z
        .number()
        .int('Order index must be an integer')
        .min(0, 'Order index must be non-negative')
});

export const updateListSchema = z.object({
    name: z
        .string()
        .min(1, 'List name is required')
        .max(100, 'List name must be less than 100 characters')
        .optional(),
    orderIndex: z
        .number()
        .int('Order index must be an integer')
        .min(0, 'Order index must be non-negative')
        .optional()
});

// Task validation schemas
export const createTaskSchema = z.object({
    taskName: z
        .string()
        .min(1, 'Task name is required')
        .max(200, 'Task name must be less than 200 characters'),
    description: z
        .string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),
    dueTime: z
        .string()
        .datetime('Invalid date format')
        .optional()
        .transform((val) => val ? new Date(val) : undefined),
    priority: z
        .enum(['low', 'medium', 'high'])
        .default('medium'),
    boardId: z
        .string()
        .min(1, 'Board ID is required'),
    listId: z
        .string()
        .min(1, 'List ID is required')
        .optional()
});

export const updateTaskSchema = z.object({
    taskName: z
        .string()
        .min(1, 'Task name is required')
        .max(200, 'Task name must be less than 200 characters')
        .optional(),
    description: z
        .string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),
    dueTime: z
        .string()
        .datetime('Invalid date format')
        .optional()
        .transform((val) => val ? new Date(val) : undefined),
    completed: z
        .boolean()
        .optional(),
    priority: z
        .enum(['low', 'medium', 'high'])
        .optional(),
    status: z
        .enum(['todo', 'in_progress', 'done'])
        .optional(),
    listId: z
        .string()
        .optional()
});

// Calendar validation schemas
export const createCalendarSchema = z.object({
    name: z
        .string()
        .min(1, 'Calendar name is required')
        .max(100, 'Calendar name must be less than 100 characters'),
    startDate: z
        .string()
        .datetime('Invalid start date format')
        .optional()
        .transform((val) => val ? new Date(val) : undefined),
    endDate: z
        .string()
        .datetime('Invalid end date format')
        .optional()
        .transform((val) => val ? new Date(val) : undefined)
});

export const createEventSchema = z.object({
    startTime: z
        .string()
        .datetime('Invalid start time format')
        .transform((val) => new Date(val)),
    endTime: z
        .string()
        .datetime('Invalid end time format')
        .transform((val) => new Date(val)),
    eventType: z
        .string()
        .min(1, 'Event type is required')
        .max(50, 'Event type must be less than 50 characters'),
    alarm: z
        .boolean()
        .default(false),
    reminder: z
        .number()
        .int('Reminder must be an integer')
        .min(0, 'Reminder must be non-negative')
        .optional(),
    calendarId: z
        .string()
        .min(1, 'Calendar ID is required'),
    taskId: z
        .string()
        .optional()
});

// Focus session validation schemas
export const createFocusSessionSchema = z.object({
    taskId: z
        .string()
        .optional()
});

export const updateFocusSessionSchema = z.object({
    endTime: z
        .string()
        .datetime('Invalid end time format')
        .transform((val) => new Date(val))
        .optional(),
    completed: z
        .boolean()
        .optional()
});

// Post validation schemas
export const createPostSchema = z.object({
    title: z
        .string()
        .min(1, 'Post title is required')
        .max(200, 'Post title must be less than 200 characters'),
    description: z
        .string()
        .max(2000, 'Post description must be less than 2000 characters')
        .optional(),
    privacySetting: z
        .enum(['public', 'private'])
        .default('private')
});

// Share validation schemas
export const createShareSchema = z.object({
    resourceType: z
        .enum(['task', 'board', 'calendar']),
    resourceId: z
        .string()
        .min(1, 'Resource ID is required'),
    sharedWithUserId: z
        .string()
        .min(1, 'Shared with user ID is required'),
    permissionLevel: z
        .enum(['read', 'write', 'admin'])
        .default('read')
});

// Generic ID validation
export const idSchema = z.object({
    id: z
        .string()
        .min(1, 'ID is required')
});

// Pagination validation
export const paginationSchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 1)
        .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 10)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.parse({
                ...req.body,
                ...req.params,
                ...req.query
            });

            // Replace req properties with validated data
            Object.keys(result).forEach(key => {
                if (req.body && key in req.body) req.body[key] = result[key];
                if (req.params && key in req.params) req.params[key] = result[key];
                if (req.query && key in req.query) req.query[key] = result[key];
            });

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors: ValidationError[] = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                res.status(400).json({
                    error: 'Validation failed',
                    details: validationErrors
                });
                return;
            }

            res.status(500).json({
                error: 'Internal server error',
                message: 'Validation error'
            });
        }
    };
};