import { Response } from 'express';
import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { prisma } from '../app';
import { AuthenticatedRequest } from '../types';

const unlinkAsync = promisify(fs.unlink);

// File storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.params.type || 'general';
        const uploadPath = path.join('uploads', uploadType);

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = (req as AuthenticatedRequest).user?.id;
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(file.originalname);

        const filename = `${userId}_${timestamp}_${randomString}${extension}`;
        cb(null, filename);
    }
});

// File filter for different upload types
const createFileFilter = (allowedTypes: string[]) => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
        }
    };
};

// Avatar upload configuration
export const avatarUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: createFileFilter([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ])
});

// Task attachment upload configuration
export const attachmentUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    },
    fileFilter: createFileFilter([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ])
});

// General file upload configuration
export const generalUpload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
        files: 10
    }
});

// Upload profile avatar
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        if (!req.file) {
            res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select an image file to upload'
            });
            return;
        }

        // Get current user to check for existing avatar
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePicture: true }
        });

        // Delete old avatar if exists
        if (currentUser?.profilePicture) {
            const oldAvatarPath = path.join(process.cwd(), currentUser.profilePicture);
            try {
                if (fs.existsSync(oldAvatarPath)) {
                    await unlinkAsync(oldAvatarPath);
                }
            } catch (error) {
                console.warn('Failed to delete old avatar:', error);
            }
        }

        // Generate URL for the uploaded file
        const fileUrl = `/api/uploads/avatars/${req.file.filename}`;

        // Update user profile with new avatar
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePicture: fileUrl },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true
            }
        });

        res.json({
            message: 'Avatar uploaded successfully! 📸',
            user: updatedUser,
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                url: fileUrl
            }
        });

    } catch (error) {
        // Clean up uploaded file if database operation fails
        if (req.file) {
            try {
                await unlinkAsync(req.file.path);
            } catch (cleanupError) {
                console.warn('Failed to cleanup uploaded file:', cleanupError);
            }
        }

        console.error('Upload avatar error:', error);
        res.status(500).json({
            error: 'Failed to upload avatar',
            message: 'Internal server error'
        });
    }
};

// Upload task attachments
export const uploadTaskAttachments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({
                error: 'No files uploaded',
                message: 'Please select files to upload'
            });
            return;
        }

        // Verify task exists and user owns it
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId
            }
        });

        if (!task) {
            // Clean up uploaded files
            for (const file of req.files) {
                try {
                    await unlinkAsync(file.path);
                } catch (error) {
                    console.warn('Failed to cleanup file:', error);
                }
            }

            res.status(404).json({
                error: 'Task not found',
                message: 'Task not found or you do not have access to it'
            });
            return;
        }

        // Process uploaded files
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/attachments/${file.filename}`,
            uploadedAt: new Date()
        }));

        // For now, we'll store file info in task notes
        // In a production app, you'd create a separate attachments table
        const attachmentNote = `📎 **Attachments uploaded:**\n${uploadedFiles.map(f => `- ${f.originalName} (${(f.size / 1024).toFixed(1)} KB)`).join('\n')}`;

        await prisma.note.create({
            data: {
                content: attachmentNote,
                taskId
            }
        });

        res.json({
            message: `${uploadedFiles.length} file(s) uploaded successfully! 📎`,
            files: uploadedFiles,
            task: {
                id: task.id,
                name: task.taskName
            }
        });

    } catch (error) {
        // Clean up uploaded files if database operation fails
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                try {
                    await unlinkAsync(file.path);
                } catch (cleanupError) {
                    console.warn('Failed to cleanup uploaded file:', cleanupError);
                }
            }
        }

        console.error('Upload task attachments error:', error);
        res.status(500).json({
            error: 'Failed to upload attachments',
            message: 'Internal server error'
        });
    }
};

// Get file info
export const getFileInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { type, filename } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const filePath = path.join('uploads', type, filename);
        const fullPath = path.join(process.cwd(), filePath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            res.status(404).json({
                error: 'File not found',
                message: 'The requested file does not exist'
            });
            return;
        }

        // Get file stats
        const stats = fs.statSync(fullPath);
        const fileExtension = path.extname(filename);

        // Basic file info
        const fileInfo = {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            extension: fileExtension,
            type: type,
            url: `/${filePath}`,
            sizeFormatted: formatFileSize(stats.size)
        };

        res.json({
            message: 'File information retrieved successfully',
            file: fileInfo
        });

    } catch (error) {
        console.error('Get file info error:', error);
        res.status(500).json({
            error: 'Failed to retrieve file information',
            message: 'Internal server error'
        });
    }
};

// Delete file
export const deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { type, filename } = req.params;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        // Check if user owns the file (basic check by filename prefix)
        if (!filename.startsWith(userId)) {
            res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to delete this file'
            });
            return;
        }

        const filePath = path.join('uploads', type, filename);
        const fullPath = path.join(process.cwd(), filePath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            res.status(404).json({
                error: 'File not found',
                message: 'The file you are trying to delete does not exist'
            });
            return;
        }

        // Delete the file
        await unlinkAsync(fullPath);

        // If it's an avatar, update user profile
        if (type === 'avatars') {
            await prisma.user.update({
                where: { id: userId },
                data: { profilePicture: null }
            });
        }

        res.json({
            message: 'File deleted successfully! 🗑️'
        });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            error: 'Failed to delete file',
            message: 'Internal server error'
        });
    }
};

// Get user's uploaded files
export const getUserFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { type } = req.query as { type?: string };

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const uploadDir = path.join(process.cwd(), 'uploads');
        const files: Array<{
            filename: string;
            originalName: string;
            size: number;
            sizeFormatted: string;
            type: string;
            url: string;
            uploadedAt: Date;
        }> = [];

        // Define upload types to scan
        const uploadTypes = type ? [type] : ['avatars', 'attachments', 'general'];

        for (const uploadType of uploadTypes) {
            const typeDir = path.join(uploadDir, uploadType);

            if (!fs.existsSync(typeDir)) {
                continue;
            }

            const typeFiles = fs.readdirSync(typeDir);

            for (const filename of typeFiles) {
                // Check if file belongs to user
                if (!filename.startsWith(userId)) {
                    continue;
                }

                const filePath = path.join(typeDir, filename);
                const stats = fs.statSync(filePath);

                // Extract original name from filename (basic approach)
                const parts = filename.split('_');
                const originalName = parts.length > 2 ? parts.slice(2).join('_') : filename;

                files.push({
                    filename,
                    originalName,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    type: uploadType,
                    url: `/uploads/${uploadType}/${filename}`,
                    uploadedAt: stats.birthtime
                });
            }
        }

        // Sort by upload date (newest first)
        files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

        res.json({
            message: 'User files retrieved successfully',
            files,
            count: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            totalSizeFormatted: formatFileSize(files.reduce((sum, file) => sum + file.size, 0))
        });

    } catch (error) {
        console.error('Get user files error:', error);
        res.status(500).json({
            error: 'Failed to retrieve user files',
            message: 'Internal server error'
        });
    }
};

// Get upload statistics
export const getUploadStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
            return;
        }

        const uploadDir = path.join(process.cwd(), 'uploads');
        const stats = {
            avatars: { count: 0, totalSize: 0 },
            attachments: { count: 0, totalSize: 0 },
            general: { count: 0, totalSize: 0 }
        };

        for (const [type, typeStats] of Object.entries(stats)) {
            const typeDir = path.join(uploadDir, type);

            if (!fs.existsSync(typeDir)) {
                continue;
            }

            const files = fs.readdirSync(typeDir);

            for (const filename of files) {
                if (!filename.startsWith(userId)) {
                    continue;
                }

                const filePath = path.join(typeDir, filename);
                const fileStats = fs.statSync(filePath);

                typeStats.count++;
                typeStats.totalSize += fileStats.size;
            }
        }

        const totalFiles = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
        const totalSize = Object.values(stats).reduce((sum, s) => sum + s.totalSize, 0);

        const response = {
            overview: {
                totalFiles,
                totalSize,
                totalSizeFormatted: formatFileSize(totalSize)
            },
            breakdown: {
                avatars: {
                    ...stats.avatars,
                    sizeFormatted: formatFileSize(stats.avatars.totalSize)
                },
                attachments: {
                    ...stats.attachments,
                    sizeFormatted: formatFileSize(stats.attachments.totalSize)
                },
                general: {
                    ...stats.general,
                    sizeFormatted: formatFileSize(stats.general.totalSize)
                }
            }
        };

        res.json({
            message: 'Upload statistics retrieved successfully',
            stats: response
        });

    } catch (error) {
        console.error('Get upload stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve upload statistics',
            message: 'Internal server error'
        });
    }
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}