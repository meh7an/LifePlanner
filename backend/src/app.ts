import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ApiError } from './types';
import { repeatScheduler } from './services/repeatScheduler';

// Load environment variables
dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Import routes
import authRoutes from './routes/authRoutes';
import boardRoutes from './routes/boardRoutes';
import taskRoutes from './routes/taskRoutes';
import calendarRoutes from './routes/calendarRoutes';
import focusRoutes from './routes/focusRoutes';
import notesRoutes from './routes/notesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import sharingRoutes from './routes/sharingRoutes';
import uploadRoutes from './routes/uploadRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import repeatRoutes from './routes/repeatRoutes';
import viewsRoutes from './routes/viewsRoutes';

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Life Planner API'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendars', calendarRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/share', sharingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/repeats', repeatRoutes);
app.use('/api/views', viewsRoutes);

// Welcome endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Welcome to Life Planner API!',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/health'
    });
});

// Global error handler
app.use((err: ApiError, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error:', err);

    // Prisma error handling
    if ('code' in err && err.code === 'P2002') {
        res.status(400).json({
            error: 'Duplicate entry',
            message: 'A record with this information already exists'
        });
        return;
    }

    // Validation errors
    if ((err as any).name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation failed',
            details: err.details
        });
        return;
    }

    // JWT errors
    if ((err as any).name === 'JsonWebTokenError') {
        res.status(401).json({
            error: 'Invalid token',
            message: 'Please log in again'
        });
        return;
    }

    // Default error response
    res.status((err as any).status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `${req.method} ${req.originalUrl} not found`
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    repeatScheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    repeatScheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Life Planner API running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);

    // Start background services
    if (process.env.NODE_ENV !== 'test') {
        repeatScheduler.start();
        console.log('🔄 Repeat scheduler initialized');
    }
});

export default app;