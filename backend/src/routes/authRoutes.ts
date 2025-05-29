import express from 'express';
import {
    register,
    login,
    refreshToken,
    getProfile,
    updateProfile,
    changePassword,
    logout
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema
} from '../utils/validation';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected routes (authentication required)
router.use(authenticate); // All routes below this middleware require authentication

router.get('/me', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);

export default router;