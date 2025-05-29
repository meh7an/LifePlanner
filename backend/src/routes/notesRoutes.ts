import express from 'express';
import {
    getTaskNotes,
    getAllNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getRecentNotes,
    getNotesStats
} from '../controllers/notesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    idSchema,
    paginationSchema
} from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All note routes require authentication
router.use(authenticate);

// Note validation schemas
const createNoteSchema = z.object({
    content: z
        .string()
        .min(1, 'Note content is required')
        .max(10000, 'Note content must be less than 10000 characters')
});

const updateNoteSchema = z.object({
    content: z
        .string()
        .min(1, 'Note content is required')
        .max(10000, 'Note content must be less than 10000 characters')
});

const searchNotesSchema = z.object({
    q: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query must be less than 100 characters'),
    boardId: z
        .string()
        .optional(),
    priority: z
        .enum(['low', 'medium', 'high'])
        .optional(),
    completed: z
        .string()
        .optional()
        .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 20)
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

const recentNotesSchema = z.object({
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 10)
        .refine((val) => val > 0 && val <= 50, 'Limit must be between 1 and 50')
});

// Global note routes
router.get('/', validate(paginationSchema), getAllNotes);
router.get('/search', validate(searchNotesSchema), searchNotes);
router.get('/recent', validate(recentNotesSchema), getRecentNotes);
router.get('/stats', getNotesStats);
router.get('/:id', validate(idSchema), getNote);
router.put('/:id', validate(idSchema.merge(updateNoteSchema)), updateNote);
router.delete('/:id', validate(idSchema), deleteNote);

// Task-specific note routes
router.get('/task/:taskId', validate(idSchema.extend({ taskId: idSchema.shape.id }).merge(paginationSchema)), getTaskNotes);
router.post('/task/:taskId', validate(idSchema.extend({ taskId: idSchema.shape.id }).merge(createNoteSchema)), createNote);

export default router;