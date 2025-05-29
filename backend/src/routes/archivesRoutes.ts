import express from 'express';
import {
    getArchives,
    getArchive,
    updateArchive,
    unarchivePost,
    getArchivesByCategory,
    getArchiveCategories,
    searchArchives,
    getArchiveStats,
    bulkArchiveByCategory
} from '../controllers/archiveController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All archive routes require authentication
router.use(authenticate);

// Archive validation schemas
const updateArchiveSchema = z.object({
    category: z
        .string()
        .min(1, 'Category is required')
        .max(50, 'Category must be less than 50 characters')
});

const getArchivesSchema = z.object({
    category: z
        .string()
        .optional(),
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
        .enum(['archiveDate'])
        .optional()
        .default('archiveDate'),
    sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .default('desc')
}).merge(paginationSchema);

const searchArchivesSchema = z.object({
    q: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query must be less than 100 characters')
        .optional(),
    category: z
        .string()
        .optional(),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 20)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

const getArchivesByCategorySchema = z.object({
    category: z
        .string()
        .min(1, 'Category is required'),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 20)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

const bulkArchiveSchema = z.object({
    sourceCategory: z
        .string()
        .min(1, 'Source category is required'),
    targetCategory: z
        .string()
        .min(1, 'Target category is required')
});

// Archive routes
router.get('/', validate(getArchivesSchema), getArchives);
router.get('/categories', getArchiveCategories);
router.get('/search', validate(searchArchivesSchema), searchArchives);
router.get('/stats', getArchiveStats);
router.get('/category/:category', validate(getArchivesByCategorySchema), getArchivesByCategory);
router.get('/:id', validate(idSchema), getArchive);
router.put('/:id', validate(idSchema.merge(updateArchiveSchema)), updateArchive);
router.delete('/:id', validate(idSchema), unarchivePost);

// Bulk operations
router.put('/bulk/move-category', validate(bulkArchiveSchema), bulkArchiveByCategory);

export default router;