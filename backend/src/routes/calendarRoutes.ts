import express from 'express';
import {
    getCalendars,
    getCalendar,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getCalendarView,
    getUpcomingEvents
} from '../controllers/calendarController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    createCalendarSchema,
    createEventSchema,
    idSchema,
    paginationSchema
} from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All calendar routes require authentication
router.use(authenticate);

// Update schemas for calendar operations
const updateCalendarSchema = z.object({
    name: z
        .string()
        .min(1, 'Calendar name is required')
        .max(100, 'Calendar name must be less than 100 characters')
        .optional(),
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

const updateEventSchema = z.object({
    startTime: z
        .string()
        .datetime('Invalid start time format')
        .transform((val) => new Date(val))
        .optional(),
    endTime: z
        .string()
        .datetime('Invalid end time format')
        .transform((val) => new Date(val))
        .optional(),
    eventType: z
        .string()
        .min(1, 'Event type is required')
        .max(50, 'Event type must be less than 50 characters')
        .optional(),
    alarm: z
        .boolean()
        .optional(),
    reminder: z
        .number()
        .int('Reminder must be an integer')
        .min(0, 'Reminder must be non-negative')
        .optional(),
    taskId: z
        .string()
        .optional()
});

const calendarViewSchema = z.object({
    startDate: z
        .string()
        .datetime('Invalid start date format'),
    endDate: z
        .string()
        .datetime('Invalid end date format'),
    view: z
        .enum(['month', 'week', 'day'])
        .optional()
        .default('month'),
    calendarId: z
        .string()
        .optional()
});

const upcomingEventsSchema = z.object({
    days: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 7)
        .refine((val) => val > 0 && val <= 365, 'Days must be between 1 and 365')
});

// Calendar routes
router.get('/', getCalendars);
router.get('/:id', validate(idSchema), getCalendar);
router.post('/', validate(createCalendarSchema), createCalendar);
router.put('/:id', validate(idSchema.merge(updateCalendarSchema)), updateCalendar);
router.delete('/:id', validate(idSchema), deleteCalendar);

// Event routes
router.get('/events/all', validate(paginationSchema), getEvents);
router.get('/events/upcoming', validate(upcomingEventsSchema), getUpcomingEvents);
router.get('/events/view', validate(calendarViewSchema), getCalendarView);
router.post('/events', validate(createEventSchema), createEvent);
router.put('/events/:id', validate(idSchema.merge(updateEventSchema)), updateEvent);
router.delete('/events/:id', validate(idSchema), deleteEvent);

export default router;