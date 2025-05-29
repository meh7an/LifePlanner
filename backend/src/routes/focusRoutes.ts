import express from 'express';
import {
    getFocusSessions,
    getFocusSession,
    startFocusSession,
    endFocusSession,
    getActiveSession,
    getFocusStats,
    getTodayFocusSummary,
    deleteFocusSession
} from '../controllers/focusController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    createFocusSessionSchema,
    updateFocusSessionSchema,
    idSchema,
    paginationSchema
} from '../utils/validation';
import { z } from 'zod';

const router = express.Router();

// All focus routes require authentication
router.use(authenticate);

// Focus statistics schema
const focusStatsSchema = z.object({
    period: z
        .enum(['week', 'month', 'year', 'all'])
        .optional()
        .default('week')
});

// Focus session routes
router.get('/', validate(paginationSchema), getFocusSessions);
router.get('/active', getActiveSession);
router.get('/stats', validate(focusStatsSchema), getFocusStats);
router.get('/today', getTodayFocusSummary);
router.get('/:id', validate(idSchema), getFocusSession);
router.post('/start', validate(createFocusSessionSchema), startFocusSession);
router.put('/:id/end', validate(idSchema.merge(updateFocusSessionSchema)), endFocusSession);
router.delete('/:id', validate(idSchema), deleteFocusSession);

export default router;