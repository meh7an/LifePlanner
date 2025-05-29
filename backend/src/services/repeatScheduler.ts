import { prisma } from '../app';
import { RepeatPeriod } from '../types';

// Background service to process recurring tasks
export class RepeatScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

    start(): void {
        console.log('🔄 Starting repeat scheduler...');

        // Run immediately on startup
        this.processAllRepeats();

        // Set up recurring check
        this.intervalId = setInterval(() => {
            this.processAllRepeats();
        }, this.CHECK_INTERVAL);

        console.log(`✅ Repeat scheduler started! Checking every ${this.CHECK_INTERVAL / 1000 / 60} minutes`);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Repeat scheduler stopped');
        }
    }

    private async processAllRepeats(): Promise<void> {
        try {
            console.log('🔄 Processing recurring tasks...');

            const now = new Date();
            const activeRepeats = await prisma.repeat.findMany({
                where: {
                    OR: [
                        { infiniteRepeat: true },
                        { endDate: { gte: now } }
                    ]
                },
                include: {
                    task: {
                        select: {
                            id: true,
                            taskName: true,
                            description: true,
                            priority: true,
                            boardId: true,
                            listId: true,
                            userId: true,
                            dueTime: true
                        }
                    }
                }
            });

            let processedCount = 0;
            let createdCount = 0;

            for (const repeat of activeRepeats) {
                try {
                    const shouldCreateNew = await this.shouldCreateNewInstance(repeat);

                    if (shouldCreateNew) {
                        const nextDueDate = this.calculateNextOccurrence(repeat);

                        if (nextDueDate) {
                            // Create new task instance
                            const newTask = await prisma.task.create({
                                data: {
                                    taskName: this.generateTaskName(repeat.task.taskName, nextDueDate),
                                    description: repeat.task.description,
                                    priority: repeat.task.priority,
                                    dueTime: nextDueDate,
                                    userId: repeat.task.userId,
                                    boardId: repeat.task.boardId,
                                    listId: repeat.task.listId,
                                    newTask: true,
                                    completed: false,
                                    status: 'todo'
                                }
                            });

                            console.log(`✅ Created recurring task: "${newTask.taskName}" due ${nextDueDate.toISOString()}`);
                            createdCount++;
                        }
                    }

                    processedCount++;
                } catch (error) {
                    console.error(`❌ Error processing repeat for task "${repeat.task.taskName}":`, error);
                }
            }

            if (createdCount > 0) {
                console.log(`🎉 Processed ${processedCount} repeats, created ${createdCount} new task instances`);
            } else {
                console.log(`✅ Processed ${processedCount} repeats, no new tasks needed`);
            }

        } catch (error) {
            console.error('❌ Error in repeat scheduler:', error);
        }
    }

    private async shouldCreateNewInstance(repeat: any): Promise<boolean> {
        const now = new Date();
        const nextOccurrence = this.calculateNextOccurrence(repeat);

        if (!nextOccurrence || nextOccurrence > now) {
            return false;
        }

        // Check if we already created a task for this occurrence
        const existingTask = await prisma.task.findFirst({
            where: {
                userId: repeat.task.userId,
                taskName: {
                    contains: repeat.task.taskName
                },
                dueTime: {
                    gte: new Date(nextOccurrence.getTime() - 24 * 60 * 60 * 1000), // Within 24 hours
                    lte: new Date(nextOccurrence.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        return !existingTask;
    }

    private calculateNextOccurrence(repeat: any): Date | null {
        const now = new Date();
        const { periodType, periodValue, repeatDays, endDate, infiniteRepeat } = repeat;
        const originalDueTime = repeat.task.dueTime;

        // Check if repeat has ended
        if (!infiniteRepeat && endDate && new Date(endDate) < now) {
            return null;
        }

        // Use original due time as base, or current time if no due time
        const baseTime = originalDueTime ? new Date(originalDueTime) : new Date();
        let nextOccurrence = new Date(baseTime);

        // Calculate next occurrence based on period type
        switch (periodType as RepeatPeriod) {
            case 'daily':
                // Find next daily occurrence
                while (nextOccurrence <= now) {
                    nextOccurrence.setDate(nextOccurrence.getDate() + periodValue);
                }
                break;

            case 'weekly':
                if (repeatDays && repeatDays.length > 0) {
                    nextOccurrence = this.getNextWeeklyOccurrence(now, repeatDays, baseTime);
                } else {
                    // Default weekly repeat
                    while (nextOccurrence <= now) {
                        nextOccurrence.setDate(nextOccurrence.getDate() + (7 * periodValue));
                    }
                }
                break;

            case 'monthly':
                while (nextOccurrence <= now) {
                    nextOccurrence.setMonth(nextOccurrence.getMonth() + periodValue);
                }
                break;

            case 'yearly':
                while (nextOccurrence <= now) {
                    nextOccurrence.setFullYear(nextOccurrence.getFullYear() + periodValue);
                }
                break;

            default:
                return null;
        }

        // Ensure it's still within the end date
        if (!infiniteRepeat && endDate && nextOccurrence > new Date(endDate)) {
            return null;
        }

        return nextOccurrence;
    }

    private getNextWeeklyOccurrence(now: Date, repeatDays: string[], baseTime: Date): Date {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = now.getDay();
        const baseHour = baseTime.getHours();
        const baseMinute = baseTime.getMinutes();

        // Find the next valid day
        for (let i = 0; i < 14; i++) { // Check next 2 weeks
            const checkDate = new Date(now);
            checkDate.setDate(now.getDate() + i);

            const checkDay = checkDate.getDay();
            const dayName = dayNames[checkDay];

            if (repeatDays.includes(dayName)) {
                // Set the time to match the original
                checkDate.setHours(baseHour, baseMinute, 0, 0);

                // Make sure it's in the future
                if (checkDate > now) {
                    return checkDate;
                }
            }
        }

        // Fallback to next week same day
        const fallback = new Date(now);
        fallback.setDate(now.getDate() + 7);
        fallback.setHours(baseHour, baseMinute, 0, 0);
        return fallback;
    }

    private generateTaskName(originalName: string, dueDate: Date): string {
        const dateStr = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        // Remove any existing date suffix
        const cleanName = originalName.replace(/\s*\([^)]*\)$/, '');

        return `${cleanName} (${dateStr})`;
    }

    // Manual processing method (for API endpoint)
    async processRepeatsForUser(userId: string): Promise<{
        processedCount: number;
        createdCount: number;
        createdTasks: string[];
    }> {
        const now = new Date();
        const userRepeats = await prisma.repeat.findMany({
            where: {
                task: {
                    userId
                },
                OR: [
                    { infiniteRepeat: true },
                    { endDate: { gte: now } }
                ]
            },
            include: {
                task: {
                    select: {
                        id: true,
                        taskName: true,
                        description: true,
                        priority: true,
                        boardId: true,
                        listId: true,
                        userId: true,
                        dueTime: true
                    }
                }
            }
        });

        let processedCount = 0;
        let createdCount = 0;
        const createdTasks: string[] = [];

        for (const repeat of userRepeats) {
            try {
                const shouldCreateNew = await this.shouldCreateNewInstance(repeat);

                if (shouldCreateNew) {
                    const nextDueDate = this.calculateNextOccurrence(repeat);

                    if (nextDueDate) {
                        const newTask = await prisma.task.create({
                            data: {
                                taskName: this.generateTaskName(repeat.task.taskName, nextDueDate),
                                description: repeat.task.description,
                                priority: repeat.task.priority,
                                dueTime: nextDueDate,
                                userId: repeat.task.userId,
                                boardId: repeat.task.boardId,
                                listId: repeat.task.listId,
                                newTask: true,
                                completed: false,
                                status: 'todo'
                            }
                        });

                        createdTasks.push(newTask.taskName);
                        createdCount++;
                    }
                }

                processedCount++;
            } catch (error) {
                console.error(`Error processing repeat for task "${repeat.task.taskName}":`, error);
            }
        }

        return {
            processedCount,
            createdCount,
            createdTasks
        };
    }
}

// Export singleton instance
export const repeatScheduler = new RepeatScheduler();