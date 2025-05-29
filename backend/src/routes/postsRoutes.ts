import express from 'express';
import {
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    createMemoryFromPost,
    archivePost,
    searchPosts,
    getRecentPosts,
    getPostStats
} from '../controllers/postsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema, paginationSchema, createPostSchema } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All post routes require authentication
router.use(authenticate);

// Post validation schemas
const updatePostSchema = z.object({
    title: z
        .string()
        .min(1, 'Post title is required')
        .max(200, 'Post title must be less than 200 characters')
        .optional(),
    description: z
        .string()
        .max(2000, 'Post description must be less than 2000 characters')
        .optional(),
    privacySetting: z
        .enum(['public', 'private'])
        .optional()
});

const searchPostsSchema = z.object({
    q: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query must be less than 100 characters'),
    privacySetting: z
        .enum(['public', 'private'])
        .optional(),
    tags: z
        .string()
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

const createMemorySchema = z.object({
    tags: z
        .array(z.string().min(1).max(50))
        .optional()
        .default([])
});

const archivePostSchema = z.object({
    category: z
        .string()
        .min(1, 'Category is required')
        .max(50, 'Category must be less than 50 characters')
        .optional()
        .default('general')
});

const recentPostsSchema = z.object({
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 10)
        .refine((val) => val > 0 && val <= 50, 'Limit must be between 1 and 50')
});

// Post routes
router.get('/', validate(paginationSchema), getPosts);
router.get('/search', validate(searchPostsSchema), searchPosts);
router.get('/recent', validate(recentPostsSchema), getRecentPosts);
router.get('/stats', getPostStats);
router.get('/:id', validate(idSchema), getPost);
router.post('/', validate(createPostSchema), createPost);
router.put('/:id', validate(idSchema.merge(updatePostSchema)), updatePost);
router.delete('/:id', validate(idSchema), deletePost);

// Memory and archive actions
router.post('/:id/memory', validate(idSchema.merge(createMemorySchema)), createMemoryFromPost);
router.post('/:id/archive', validate(idSchema.merge(archivePostSchema)), archivePost);

export default router;