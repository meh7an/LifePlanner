import express from 'express';
import {
    getMemories,
    getMemory,
    updateMemory,
    deleteMemory,
    getMemoriesByTag,
    getMemoryTags,
    searchMemories,
    getMemoryStats
} from '../controllers/memoriesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All memory routes require authentication
router.use(authenticate);

// Memory validation schemas
const updateMemorySchema = z.object({
    tags: z
        .array(z.string().min(1).max(50))
        .min(1, 'At least one tag is required')
        .max(20, 'Maximum 20 tags allowed')
});

const getMemoriesSchema = z.object({
    tags: z
        .string()
        .optional(), // Comma-separated tags
    search: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .optional(),
    startDate: z
        .string()
        .datetime('Invalid start date format')
        .optional(),
    endDate: z
        .string()
        .datetime('Invalid end date format')
        .optional(),
    sortBy: z
        .enum(['createdAt'])
        .optional()
        .default('createdAt'),
    sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .default('desc')
}).merge(paginationSchema);

const searchMemoriesSchema = z.object({
    q: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query must be less than 100 characters')
        .optional(),
    tags: z
        .string()
        .optional(), // Comma-separated tags
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 20)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

const getMemoriesByTagSchema = z.object({
    tag: z
        .string()
        .min(1, 'Tag is required'),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 20)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

// Memory routes
router.get('/', validate(getMemoriesSchema), getMemories);
router.get('/tags', getMemoryTags);
router.get('/search', validate(searchMemoriesSchema), searchMemories);
router.get('/stats', getMemoryStats);
router.get('/tag/:tag', validate(getMemoriesByTagSchema), getMemoriesByTag);
router.get('/:id', validate(idSchema), getMemory);
router.put('/:id', validate(idSchema.merge(updateMemorySchema)), updateMemory);
router.delete('/:id', validate(idSchema), deleteMemory);

export default router;