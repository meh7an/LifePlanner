import express from 'express';
import {
    getTaskRepeats,
    getUserRepeats,
    createRepeat,
    updateRepeat,
    deleteRepeat,
    getUpcomingOccurrences,
    processRepeats,
    getRepeatStats
} from '../controllers/repeatController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All repeat routes require authentication
router.use(authenticate);

// Repeat validation schemas
const createRepeatSchema = z.object({
    periodType: z
        .enum(['daily', 'weekly', 'monthly', 'yearly']),
    periodValue: z
        .number()
        .int('Period value must be an integer')
        .min(1, 'Period value must be at least 1')
        .max(365, 'Period value cannot exceed 365')
        .optional()
        .default(1),
    repeatDays: z
        .array(z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']))
        .optional()
        .default([]),
    endDate: z
        .string()
        .datetime('Invalid end date format')
        .optional()
        .transform((val) => val ? new Date(val) : undefined),
    infiniteRepeat: z
        .boolean()
        .optional()
        .default(false)
});

const updateRepeatSchema = z.object({
    periodType: z
        .enum(['daily', 'weekly', 'monthly', 'yearly'])
        .optional(),
    periodValue: z
        .number()
        .int('Period value must be an integer')
        .min(1, 'Period value must be at least 1')
        .max(365, 'Period value cannot exceed 365')
        .optional(),
    repeatDays: z
        .array(z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']))
        .optional(),
    endDate: z
        .string()
        .datetime('Invalid end date format')
        .optional()
        .transform((val) => val ? new Date(val) : undefined),
    infiniteRepeat: z
        .boolean()
        .optional()
});

const getUserRepeatsSchema = z.object({
    periodType: z
        .enum(['daily', 'weekly', 'monthly', 'yearly'])
        .optional(),
    active: z
        .string()
        .optional()
        .transform((val) => val === 'true' ? 'true' : val === 'false' ? 'false' : undefined)
}).merge(paginationSchema);

const upcomingOccurrencesSchema = z.object({
    taskId: z
        .string()
        .optional(),
    days: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 30)
        .refine((val) => val > 0 && val <= 365, 'Days must be between 1 and 365'),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 20)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

// Repeat routes
router.get('/', validate(getUserRepeatsSchema), getUserRepeats);
router.get('/stats', getRepeatStats);
router.get('/upcoming', validate(upcomingOccurrencesSchema), getUpcomingOccurrences);
router.post('/process', processRepeats); // Manual trigger for processing repeats
router.get('/:id', validate(idSchema), getTaskRepeats);
router.put('/:id', validate(idSchema.merge(updateRepeatSchema)), updateRepeat);
router.delete('/:id', validate(idSchema), deleteRepeat);

// Task-specific repeat routes
router.get('/task/:taskId', validate(idSchema.extend({ taskId: idSchema.shape.id })), getTaskRepeats);
router.post('/task/:taskId', validate(idSchema.extend({ taskId: idSchema.shape.id }).merge(createRepeatSchema)), createRepeat);

export default router;