import express from 'express';
import {
    shareResource,
    getSharedByMe,
    getSharedWithMe,
    updateSharePermissions,
    removeShare,
    getSharingStats,
    findUsersToShare
} from '../controllers/sharingController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    createShareSchema,
    idSchema,
    paginationSchema
} from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All sharing routes require authentication
router.use(authenticate);

// Update share permissions schema
const updateShareSchema = z.object({
    permissionLevel: z
        .enum(['read', 'write', 'admin'])
});

// Find users schema
const findUsersSchema = z.object({
    query: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(50, 'Search query must be less than 50 characters'),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 10)
        .refine((val) => val > 0 && val <= 50, 'Limit must be between 1 and 50')
});

// Sharing filter schema
const sharingFilterSchema = z.object({
    resourceType: z
        .enum(['task', 'board', 'calendar'])
        .optional(),
    permissionLevel: z
        .enum(['read', 'write', 'admin'])
        .optional()
}).merge(paginationSchema);

// Sharing routes
router.post('/', validate(createShareSchema), shareResource);
router.get('/by-me', validate(sharingFilterSchema), getSharedByMe);
router.get('/with-me', validate(sharingFilterSchema), getSharedWithMe);
router.get('/stats', getSharingStats);
router.get('/users/search', validate(findUsersSchema), findUsersToShare);
router.put('/:id/permissions', validate(idSchema.merge(updateShareSchema)), updateSharePermissions);
router.delete('/:id', validate(idSchema), removeShare);

export default router;