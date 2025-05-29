import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats,
    triggerTestNotifications
} from '../controllers/notificationsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Notification filter schema
const notificationFilterSchema = z.object({
    type: z
        .enum([
            'task_due_soon',
            'task_overdue',
            'task_completed',
            'calendar_reminder',
            'focus_session_complete',
            'streak_milestone',
            'share_received',
            'collaboration_update',
            'system_announcement'
        ])
        .optional(),
    read: z
        .string()
        .optional()
        .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined)
}).merge(paginationSchema);

// Notification routes
router.get('/', validate(notificationFilterSchema), getNotifications);
router.get('/stats', getNotificationStats);
router.post('/test', triggerTestNotifications); // For testing purposes
router.put('/:id/read', validate(idSchema), markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', validate(idSchema), deleteNotification);

export default router;