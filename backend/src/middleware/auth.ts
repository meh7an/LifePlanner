import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../app';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                username: string;
            };
        }
    }
}

export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
}

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const options: jwt.SignOptions = {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '604800', 10),
    };

    return jwt.sign(payload as object, secret, options);
};

// Generate refresh token
export const generateRefreshToken = (payload: JWTPayload): string => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    const options: jwt.SignOptions = {
        expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000', 10),
    };

    return jwt.sign(payload as object, secret, options);
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, secret);
    return decoded as JWTPayload;
};

// Authentication middleware
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Access denied',
                message: 'No token provided or invalid format'
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            res.status(401).json({
                error: 'Access denied',
                message: 'No token provided'
            });
            return;
        }

        // Verify token
        const decoded = verifyToken(token);

        // Check if user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                status: true
            }
        });

        if (!user) {
            res.status(401).json({
                error: 'Access denied',
                message: 'User not found'
            });
            return;
        }

        if (user.status !== 'active') {
            res.status(401).json({
                error: 'Access denied',
                message: 'Account is not active'
            });
            return;
        }

        // Add user to request object
        req.user = {
            id: user.id,
            email: user.email,
            username: user.username
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token'
            });
            return;
        }

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                error: 'Access denied',
                message: 'Token expired'
            });
            return;
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Authentication failed'
        });
    }
};

// Optional authentication (for public endpoints that can work with or without auth)
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without user
            next();
            return;
        }

        const token = authHeader.substring(7);

        if (!token) {
            next();
            return;
        }

        // Try to verify token
        const decoded = verifyToken(token);

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                status: true
            }
        });

        if (user && user.status === 'active') {
            req.user = {
                id: user.id,
                email: user.email,
                username: user.username
            };
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

// Admin middleware (for future admin features)
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // First authenticate
    await authenticate(req, res, () => { });

    if (!req.user) {
        res.status(401).json({
            error: 'Access denied',
            message: 'Authentication required'
        });
        return;
    }

    // Check if user has admin privileges
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    // You can add an isAdmin field to your User model later
    // For now, we'll just check if it's a specific email or something
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

    if (!adminEmails.includes(req.user.email)) {
        res.status(403).json({
            error: 'Access denied',
            message: 'Admin privileges required'
        });
        return;
    }

    next();
};