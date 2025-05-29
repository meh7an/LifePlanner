import express from 'express';
import {
    uploadAvatar,
    uploadTaskAttachments,
    getFileInfo,
    deleteFile,
    getUserFiles,
    getUploadStats,
    avatarUpload,
    attachmentUpload,
    generalUpload
} from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { idSchema } from '../utils/validation';
import { z } from 'zod';
import { AuthenticatedRequest } from '@/types';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// File type and filename validation schema
const fileParamsSchema = z.object({
    type: z.enum(['avatars', 'attachments', 'general']),
    filename: z.string().min(1, 'Filename is required')
});

const getUserFilesSchema = z.object({
    type: z.enum(['avatars', 'attachments', 'general']).optional()
});

// Multer error handler middleware
const handleMulterError = (err: any, req: any, res: any, next: any) => {
    if (err instanceof Error) {
        if (err.message.includes('File too large')) {
            return res.status(400).json({
                error: 'File too large',
                message: 'The uploaded file exceeds the maximum allowed size'
            });
        }

        if (err.message.includes('Invalid file type')) {
            return res.status(400).json({
                error: 'Invalid file type',
                message: err.message
            });
        }

        if (err.message.includes('Too many files')) {
            return res.status(400).json({
                error: 'Too many files',
                message: 'You can only upload a limited number of files at once'
            });
        }
    }

    res.status(400).json({
        error: 'Upload failed',
        message: err.message || 'An error occurred during file upload'
    });
};


router.post('/avatar', (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    // Set the type parameter for multer storage
    req.params.type = 'avatars';
    next();
}, avatarUpload.single('avatar'), handleMulterError, uploadAvatar);

router.post('/task/:taskId/attachments', (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    // Set the type parameter for multer storage
    req.params.type = 'attachments';
    next();
}, validate(idSchema.extend({ taskId: idSchema.shape.id })), attachmentUpload.array('attachments', 5), handleMulterError, uploadTaskAttachments);

router.post('/general', (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    // Set the type parameter for multer storage
    req.params.type = 'general';
    next();
}, generalUpload.array('files', 10), handleMulterError, (req: any, res: any) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            error: 'No files uploaded',
            message: 'Please select files to upload'
        });
    }

    const uploadedFiles = req.files.map((file: any) => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/general/${file.filename}`,
        uploadedAt: new Date()
    }));

    res.json({
        message: `${uploadedFiles.length} file(s) uploaded successfully! 📁`,
        files: uploadedFiles
    });
});

// File management routes
router.get('/files', validate(getUserFilesSchema), getUserFiles);
router.get('/stats', getUploadStats);
router.get('/:type/:filename/info', validate(fileParamsSchema), getFileInfo);
router.delete('/:type/:filename', validate(fileParamsSchema), deleteFile);

export default router;