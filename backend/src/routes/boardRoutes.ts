import express from 'express';
import {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    getBoardStats
} from '../controllers/boardController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
    createBoardSchema,
    updateBoardSchema,
    createListSchema,
    updateListSchema,
    idSchema
} from '../utils/validation';

const router = express.Router();

// All board routes require authentication
router.use(authenticate);

// Board routes
router.get('/', getBoards);
router.get('/:id', validate(idSchema), getBoard);
router.post('/', validate(createBoardSchema), createBoard);
router.put('/:id', validate(idSchema.merge(updateBoardSchema)), updateBoard);
router.delete('/:id', validate(idSchema), deleteBoard);
router.get('/:id/stats', validate(idSchema), getBoardStats);

// List routes (nested under boards)
router.post('/:boardId/lists', validate(idSchema.extend({ boardId: idSchema.shape.id }).merge(createListSchema)), createList);
router.put('/lists/:id', validate(idSchema.merge(updateListSchema)), updateList);
router.delete('/lists/:id', validate(idSchema), deleteList);

export default router;