import express from 'express';
import {
    getDashboardOverview,
    getTodayOverview,
    getProductivityInsights,
    getProductivityStats
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard query schemas
const periodSchema = z.object({
    period: z
        .enum(['week', 'month', 'year'])
        .optional()
        .default('week')
});

const insightsSchema = z.object({
    period: z
        .enum(['week', 'month'])
        .optional()
        .default('week')
});

// Dashboard routes
router.get('/overview', getDashboardOverview);
router.get('/today', getTodayOverview);
router.get('/insights', validate(insightsSchema), getProductivityInsights);
router.get('/stats', validate(periodSchema), getProductivityStats);

export default router;