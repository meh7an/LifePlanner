import { Response } from 'express';
import { prisma } from '../app';
import {
    AuthenticatedRequest,
    ApiResponse,
    PaginatedResponse
} from '../types';

// Notification types and interfaces
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    userId: string;
    createdAt: Date;
    readAt?: Date;
}

export type NotificationType =
    | 'task_due_soon'
    | 'task_overdue'
    | 'task_completed'
    | 'calendar_reminder'
    | 'focus_session_complete'
    | 'streak_milestone'
    | 'share_received'
    | 'collaboration_update'
    | 'system_announcement';

// Since we don't have a notifications table in the schema, we'll simulate it
// In production, you'd add this to your Prisma schema
const notifications: Notification[] = [];

// Create notification (internal helper)
export const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
): Promise<Notification> => {
    const notification: Notification = {
        id: Math.random().toString(36).substring(2, 15),
        type,
        title,
        message,
        data,
        read: false,
        userId,
        createdAt: new Date(),
    };

    notifications.push(notification);

    // In production, you'd save to database here
    // await prisma.notification.create({ data: notification });

    return notification;
};

// Get user notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {
            type,
            read,
            page = '1',
            limit = '20'
        } = req.query as {
            type?: NotificationType;
            read?: string;
            page?: string;
            limit?: string;
        };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Filter notifications
        let userNotifications = notifications.filter(n => n.userId === userId);

        if (type) {
            userNotifications = userNotifications.filter(n => n.type === type);
        }

        if (read !== undefined) {
            const readStatus = read === 'true';
            userNotifications = userNotifications.filter(n => n.read === readStatus);
        }

        // Sort by creation date (newest first)
        userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;

        const paginatedNotifications = userNotifications.slice(startIndex, endIndex);
        const totalCount = userNotifications.length;
        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            message: 'Notifications retrieved successfully',
            notifications: paginatedNotifications,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            },
            summary: {
                total: totalCount,
                unread: userNotifications.filter(n => !n.read).length,
                read: userNotifications.filter(n => n.read).length
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            error: 'Failed to retrieve notifications',
            message: 'Internal server error'
        });
    }
};

// Mark notification as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const notification = notifications.find(n => n.id === id && n.userId === userId);

        if (!notification) {
            res.status(404).json({
                error: 'Notification not found',
                message: 'Notification not found or you do not have access to it'
            });
            return;
        }

        if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date();
        }

        res.json({
            message: 'Notification marked as read! ✅',
            notification
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            error: 'Failed to mark notification as read',
            message: 'Internal server error'
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const userNotifications = notifications.filter(n => n.userId === userId && !n.read);
        const now = new Date();

        userNotifications.forEach(notification => {
            notification.read = true;
            notification.readAt = now;
        });

        res.json({
            message: `${userNotifications.length} notifications marked as read! 🎉`,
            count: userNotifications.length
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            error: 'Failed to mark all notifications as read',
            message: 'Internal server error'
        });
    }
};

// Delete notification
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const notificationIndex = notifications.findIndex(n => n.id === id && n.userId === userId);

        if (notificationIndex === -1) {
            res.status(404).json({
                error: 'Notification not found',
                message: 'Notification not found or you do not have access to it'
            });
            return;
        }

        notifications.splice(notificationIndex, 1);

        res.json({
            message: 'Notification deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            error: 'Failed to delete notification',
            message: 'Internal server error'
        });
    }
};

// Get notification statistics
export const getNotificationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const userNotifications = notifications.filter(n => n.userId === userId);
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Group by type
        const byType = userNotifications.reduce((acc, notification) => {
            acc[notification.type] = (acc[notification.type] || 0) + 1;
            return acc;
        }, {} as Record<NotificationType, number>);

        // Recent activity
        const recentNotifications = userNotifications.filter(n => n.createdAt >= last7Days);
        const monthlyNotifications = userNotifications.filter(n => n.createdAt >= last30Days);

        const stats = {
            overview: {
                total: userNotifications.length,
                unread: userNotifications.filter(n => !n.read).length,
                read: userNotifications.filter(n => n.read).length,
                readRate: userNotifications.length > 0 ?
                    Math.round((userNotifications.filter(n => n.read).length / userNotifications.length) * 100) : 0
            },
            activity: {
                last7Days: recentNotifications.length,
                last30Days: monthlyNotifications.length,
                averagePerDay: recentNotifications.length / 7
            },
            breakdown: byType,
            mostCommonType: Object.entries(byType).reduce(
                (max, [type, count]) => count > max.count ? { type, count } : max,
                { type: 'none', count: 0 }
            )
        };

        res.json({
            message: 'Notification statistics retrieved successfully',
            stats
        });

    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve notification statistics',
            message: 'Internal server error'
        });
    }
};

// Check for due tasks and create notifications
export const checkDueTasks = async (userId: string): Promise<void> => {
    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find tasks due in next 24 hours
        const dueSoonTasks = await prisma.task.findMany({
            where: {
                userId,
                completed: false,
                dueTime: {
                    gte: now,
                    lte: in24Hours
                }
            },
            select: {
                id: true,
                taskName: true,
                dueTime: true,
                priority: true
            }
        });

        // Find overdue tasks
        const overdueTasks = await prisma.task.findMany({
            where: {
                userId,
                completed: false,
                dueTime: {
                    lt: now
                }
            },
            select: {
                id: true,
                taskName: true,
                dueTime: true,
                priority: true
            }
        });

        // Create notifications for due soon tasks
        for (const task of dueSoonTasks) {
            // Check if notification already exists
            const existingNotification = notifications.find(n =>
                n.userId === userId &&
                n.type === 'task_due_soon' &&
                n.data?.taskId === task.id
            );

            if (!existingNotification) {
                const hoursUntilDue = Math.round((task.dueTime!.getTime() - now.getTime()) / (1000 * 60 * 60));
                await createNotification(
                    userId,
                    'task_due_soon',
                    'Task Due Soon! ⏰',
                    `"${task.taskName}" is due in ${hoursUntilDue} hours`,
                    { taskId: task.id, priority: task.priority, dueTime: task.dueTime }
                );
            }
        }

        // Create notifications for overdue tasks
        for (const task of overdueTasks) {
            const existingNotification = notifications.find(n =>
                n.userId === userId &&
                n.type === 'task_overdue' &&
                n.data?.taskId === task.id
            );

            if (!existingNotification) {
                const hoursOverdue = Math.round((now.getTime() - task.dueTime!.getTime()) / (1000 * 60 * 60));
                await createNotification(
                    userId,
                    'task_overdue',
                    'Task Overdue! 🚨',
                    `"${task.taskName}" was due ${hoursOverdue} hours ago`,
                    { taskId: task.id, priority: task.priority, dueTime: task.dueTime }
                );
            }
        }

    } catch (error) {
        console.error('Check due tasks error:', error);
    }
};

// Create task completion celebration
export const celebrateTaskCompletion = async (userId: string, taskName: string, taskId: string): Promise<void> => {
    try {
        await createNotification(
            userId,
            'task_completed',
            'Task Completed! 🎉',
            `Great job completing "${taskName}"! Keep up the momentum!`,
            { taskId, completedAt: new Date() }
        );
    } catch (error) {
        console.error('Celebrate task completion error:', error);
    }
};

// Create focus session completion notification
export const celebrateFocusSession = async (userId: string, durationMinutes: number, taskName?: string): Promise<void> => {
    try {
        const message = taskName
            ? `Completed ${durationMinutes} minutes of focused work on "${taskName}"! 🧠`
            : `Completed ${durationMinutes} minutes of focused work! Great concentration! 🧠`;

        await createNotification(
            userId,
            'focus_session_complete',
            'Focus Session Complete! 🎯',
            message,
            { durationMinutes, taskName, completedAt: new Date() }
        );
    } catch (error) {
        console.error('Celebrate focus session error:', error);
    }
};

// Create streak milestone notification
export const celebrateStreakMilestone = async (userId: string, streakType: string, count: number): Promise<void> => {
    try {
        const milestones = [7, 14, 30, 50, 100];

        if (milestones.includes(count)) {
            const streakName = streakType === 'daily_tasks' ? 'daily task' : 'focus session';
            await createNotification(
                userId,
                'streak_milestone',
                `${count}-Day Streak! 🔥`,
                `Amazing! You've maintained your ${streakName} streak for ${count} days straight! Keep it up!`,
                { streakType, count, milestone: true }
            );
        }
    } catch (error) {
        console.error('Celebrate streak milestone error:', error);
    }
};

// Create share received notification
export const notifyShareReceived = async (
    userId: string,
    resourceType: string,
    resourceName: string,
    sharedByUsername: string
): Promise<void> => {
    try {
        await createNotification(
            userId,
            'share_received',
            'New Shared Resource! 🤝',
            `${sharedByUsername} shared a ${resourceType} "${resourceName}" with you`,
            { resourceType, resourceName, sharedBy: sharedByUsername }
        );
    } catch (error) {
        console.error('Notify share received error:', error);
    }
};

// Manual notification trigger (for testing)
export const triggerTestNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Create various test notifications
        const testNotifications = [
            {
                type: 'task_due_soon' as NotificationType,
                title: 'Task Due Soon! ⏰',
                message: 'Your task "Complete API documentation" is due in 2 hours'
            },
            {
                type: 'focus_session_complete' as NotificationType,
                title: 'Focus Session Complete! 🎯',
                message: 'Great job! You completed 25 minutes of focused work!'
            },
            {
                type: 'streak_milestone' as NotificationType,
                title: '7-Day Streak! 🔥',
                message: 'Amazing! You\'ve maintained your daily task streak for 7 days!'
            },
            {
                type: 'share_received' as NotificationType,
                title: 'New Shared Resource! 🤝',
                message: 'John shared a board "Project Alpha" with you'
            }
        ];

        for (const notif of testNotifications) {
            await createNotification(userId, notif.type, notif.title, notif.message);
        }

        res.json({
            message: `${testNotifications.length} test notifications created successfully! 🧪`,
            count: testNotifications.length
        });

    } catch (error) {
        console.error('Trigger test notifications error:', error);
        res.status(500).json({
            error: 'Failed to create test notifications',
            message: 'Internal server error'
        });
    }
};