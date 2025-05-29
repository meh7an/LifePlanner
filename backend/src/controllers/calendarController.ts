import { Request, Response } from 'express';
import { prisma } from '../app';

// Get all calendars for authenticated user
export const getCalendars = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const calendars = await prisma.calendar.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            message: 'Calendars retrieved successfully',
            calendars,
            count: calendars.length
        });

    } catch (error) {
        console.error('Get calendars error:', error);
        res.status(500).json({
            error: 'Failed to retrieve calendars',
            message: 'Internal server error'
        });
    }
};

// Get single calendar by ID
export const getCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const calendar = await prisma.calendar.findFirst({
            where: {
                id,
                userId
            },
            include: {
                events: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                taskName: true,
                                description: true,
                                priority: true,
                                completed: true
                            }
                        }
                    },
                    orderBy: { startTime: 'asc' }
                },
                _count: {
                    select: { events: true }
                }
            }
        });

        if (!calendar) {
            res.status(404).json({
                error: 'Calendar not found',
                message: 'Calendar not found or you do not have access to it'
            });
            return;
        }

        res.json({
            message: 'Calendar retrieved successfully',
            calendar
        });

    } catch (error) {
        console.error('Get calendar error:', error);
        res.status(500).json({
            error: 'Failed to retrieve calendar',
            message: 'Internal server error'
        });
    }
};

// Create new calendar
export const createCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, startDate, endDate } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Validate date range
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            res.status(400).json({
                error: 'Invalid date range',
                message: 'Start date must be before end date'
            });
            return;
        }

        const calendar = await prisma.calendar.create({
            data: {
                name,
                startDate,
                endDate,
                userId
            },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        res.status(201).json({
            message: 'Calendar created successfully! 📅',
            calendar
        });

    } catch (error) {
        console.error('Create calendar error:', error);
        res.status(500).json({
            error: 'Failed to create calendar',
            message: 'Internal server error'
        });
    }
};

// Update calendar
export const updateCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, startDate, endDate } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if calendar exists and belongs to user
        const existingCalendar = await prisma.calendar.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingCalendar) {
            res.status(404).json({
                error: 'Calendar not found',
                message: 'Calendar not found or you do not have access to it'
            });
            return;
        }

        // Validate date range if both dates are provided
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            res.status(400).json({
                error: 'Invalid date range',
                message: 'Start date must be before end date'
            });
            return;
        }

        const updatedCalendar = await prisma.calendar.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(startDate !== undefined && { startDate }),
                ...(endDate !== undefined && { endDate })
            },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        res.json({
            message: 'Calendar updated successfully! ✨',
            calendar: updatedCalendar
        });

    } catch (error) {
        console.error('Update calendar error:', error);
        res.status(500).json({
            error: 'Failed to update calendar',
            message: 'Internal server error'
        });
    }
};

// Delete calendar
export const deleteCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if calendar exists and belongs to user
        const existingCalendar = await prisma.calendar.findFirst({
            where: {
                id,
                userId
            },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        if (!existingCalendar) {
            res.status(404).json({
                error: 'Calendar not found',
                message: 'Calendar not found or you do not have access to it'
            });
            return;
        }

        // Check if calendar has events
        if (existingCalendar._count.events > 0) {
            res.status(400).json({
                error: 'Cannot delete calendar',
                message: 'Calendar contains events. Please delete events first or move them to another calendar.'
            });
            return;
        }

        await prisma.calendar.delete({
            where: { id }
        });

        res.json({
            message: 'Calendar deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete calendar error:', error);
        res.status(500).json({
            error: 'Failed to delete calendar',
            message: 'Internal server error'
        });
    }
};

// Get events (with filtering)
export const getEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            calendarId,
            startDate,
            endDate,
            eventType,
            withTasks = 'false',
            page = '1',
            limit = '50'
        } = req.query;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Build where clause
        const where: any = {
            calendar: {
                userId
            }
        };

        if (calendarId) where.calendarId = calendarId;
        if (eventType) where.eventType = eventType;

        // Date range filtering
        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate as string);
            if (endDate) where.startTime.lte = new Date(endDate as string);
        }

        // Task filtering
        if (withTasks === 'true') {
            where.taskId = { not: null };
        } else if (withTasks === 'false') {
            where.taskId = null;
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [events, totalCount] = await Promise.all([
            prisma.calendarEvent.findMany({
                where,
                include: {
                    calendar: {
                        select: { id: true, name: true }
                    },
                    task: {
                        select: {
                            id: true,
                            taskName: true,
                            description: true,
                            priority: true,
                            completed: true,
                            status: true
                        }
                    }
                },
                orderBy: { startTime: 'asc' },
                skip,
                take: limitNum
            }),
            prisma.calendarEvent.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Events retrieved successfully',
            events,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            error: 'Failed to retrieve events',
            message: 'Internal server error'
        });
    }
};

// Create new event
export const createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { startTime, endTime, eventType, alarm, reminder, calendarId, taskId } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Validate time range
        if (new Date(startTime) >= new Date(endTime)) {
            res.status(400).json({
                error: 'Invalid time range',
                message: 'Start time must be before end time'
            });
            return;
        }

        // Verify calendar belongs to user
        const calendar = await prisma.calendar.findFirst({
            where: {
                id: calendarId,
                userId
            }
        });

        if (!calendar) {
            res.status(404).json({
                error: 'Calendar not found',
                message: 'Calendar not found or you do not have access to it'
            });
            return;
        }

        // If taskId provided, verify task belongs to user
        if (taskId) {
            const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    userId
                }
            });

            if (!task) {
                res.status(404).json({
                    error: 'Task not found',
                    message: 'Task not found or you do not have access to it'
                });
                return;
            }
        }

        const event = await prisma.calendarEvent.create({
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                eventType,
                alarm,
                reminder,
                calendarId,
                taskId
            },
            include: {
                calendar: {
                    select: { id: true, name: true }
                },
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Event created successfully! 🎉',
            event
        });

    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            error: 'Failed to create event',
            message: 'Internal server error'
        });
    }
};

// Update event
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { startTime, endTime, eventType, alarm, reminder, taskId } = req.body;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if event exists and user has access
        const existingEvent = await prisma.calendarEvent.findFirst({
            where: {
                id,
                calendar: {
                    userId
                }
            }
        });

        if (!existingEvent) {
            res.status(404).json({
                error: 'Event not found',
                message: 'Event not found or you do not have access to it'
            });
            return;
        }

        // Validate time range if both times are provided
        const newStartTime = startTime ? new Date(startTime) : existingEvent.startTime;
        const newEndTime = endTime ? new Date(endTime) : existingEvent.endTime;

        if (newStartTime >= newEndTime) {
            res.status(400).json({
                error: 'Invalid time range',
                message: 'Start time must be before end time'
            });
            return;
        }

        // If taskId is being changed, verify task belongs to user
        if (taskId && taskId !== existingEvent.taskId) {
            const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    userId
                }
            });

            if (!task) {
                res.status(404).json({
                    error: 'Task not found',
                    message: 'Task not found or you do not have access to it'
                });
                return;
            }
        }

        const updatedEvent = await prisma.calendarEvent.update({
            where: { id },
            data: {
                ...(startTime && { startTime: new Date(startTime) }),
                ...(endTime && { endTime: new Date(endTime) }),
                ...(eventType && { eventType }),
                ...(alarm !== undefined && { alarm }),
                ...(reminder !== undefined && { reminder }),
                ...(taskId !== undefined && { taskId })
            },
            include: {
                calendar: {
                    select: { id: true, name: true }
                },
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true
                    }
                }
            }
        });

        res.json({
            message: 'Event updated successfully! ✨',
            event: updatedEvent
        });

    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            error: 'Failed to update event',
            message: 'Internal server error'
        });
    }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if event exists and user has access
        const existingEvent = await prisma.calendarEvent.findFirst({
            where: {
                id,
                calendar: {
                    userId
                }
            }
        });

        if (!existingEvent) {
            res.status(404).json({
                error: 'Event not found',
                message: 'Event not found or you do not have access to it'
            });
            return;
        }

        await prisma.calendarEvent.delete({
            where: { id }
        });

        res.json({
            message: 'Event deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            error: 'Failed to delete event',
            message: 'Internal server error'
        });
    }
};

// Get calendar view (events for specific date range)
export const getCalendarView = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            startDate,
            endDate,
            view = 'month', // month, week, day
            calendarId
        } = req.query;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        if (!startDate || !endDate) {
            res.status(400).json({
                error: 'Missing date range',
                message: 'startDate and endDate are required'
            });
            return;
        }

        // Build where clause
        const where: any = {
            calendar: { userId },
            startTime: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            }
        };

        if (calendarId) where.calendarId = calendarId;

        const events = await prisma.calendarEvent.findMany({
            where,
            include: {
                calendar: {
                    select: { id: true, name: true }
                },
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        completed: true,
                        status: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // Group events by date for easier frontend consumption
        const eventsByDate: { [key: string]: any[] } = {};

        events.forEach((event: any) => {
            const dateKey = event.startTime.toISOString().split('T')[0];
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        });

        res.json({
            message: 'Calendar view retrieved successfully',
            view,
            dateRange: {
                start: startDate,
                end: endDate
            },
            events,
            eventsByDate,
            summary: {
                totalEvents: events.length,
                taskEvents: events.filter((e: any) => e.taskId).length,
                upcomingAlarms: events.filter((e: any) => e.alarm && e.startTime > new Date()).length
            }
        });

    } catch (error) {
        console.error('Get calendar view error:', error);
        res.status(500).json({
            error: 'Failed to retrieve calendar view',
            message: 'Internal server error'
        });
    }
};

// Get upcoming events (next 7 days)
export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { days = '7' } = req.query;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + parseInt(days as string));

        const events = await prisma.calendarEvent.findMany({
            where: {
                calendar: { userId },
                startTime: {
                    gte: now,
                    lte: futureDate
                }
            },
            include: {
                calendar: {
                    select: { id: true, name: true }
                },
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        priority: true,
                        completed: true
                    }
                }
            },
            orderBy: { startTime: 'asc' },
            take: 20
        });

        res.json({
            message: 'Upcoming events retrieved successfully',
            events,
            summary: {
                totalEvents: events.length,
                nextEvent: events[0] || null,
                daysRange: parseInt(days as string)
            }
        });

    } catch (error) {
        console.error('Get upcoming events error:', error);
        res.status(500).json({
            error: 'Failed to retrieve upcoming events',
            message: 'Internal server error'
        });
    }
};