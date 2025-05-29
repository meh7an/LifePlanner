import express from 'express';
import {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addTaskStep,
    updateTaskStep,
    deleteTaskStep,
    getTodayTasks
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    createTaskSchema,
    updateTaskSchema,
    idSchema,
    paginationSchema
} from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// Task step schema for validation
const createTaskStepSchema = z.object({
    description: z
        .string()
        .min(1, 'Step description is required')
        .max(500, 'Step description must be less than 500 characters'),
    orderIndex: z
        .number()
        .int('Order index must be an integer')
        .min(0, 'Order index must be non-negative')
        .optional()
});

const updateTaskStepSchema = z.object({
    description: z
        .string()
        .min(1, 'Step description is required')
        .max(500, 'Step description must be less than 500 characters')
        .optional(),
    completed: z
        .boolean()
        .optional(),
    orderIndex: z
        .number()
        .int('Order index must be an integer')
        .min(0, 'Order index must be non-negative')
        .optional()
});

// Task routes
router.get('/', validate(paginationSchema), getTasks);
router.get('/today', getTodayTasks);
router.get('/:id', validate(idSchema), getTask);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(idSchema.merge(updateTaskSchema)), updateTask);
router.delete('/:id', validate(idSchema), deleteTask);

// Task step routes
router.post('/:taskId/steps', validate(idSchema.extend({ taskId: idSchema.shape.id }).merge(createTaskStepSchema)), addTaskStep);
router.put('/steps/:id', validate(idSchema.merge(updateTaskStepSchema)), updateTaskStep);
router.delete('/steps/:id', validate(idSchema), deleteTaskStep);

export default router;