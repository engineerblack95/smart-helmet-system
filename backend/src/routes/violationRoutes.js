import express from 'express';
import { violationController } from '../controllers/violationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', violationController.getAll);
router.get('/stats', violationController.getStats);
router.get('/:id', violationController.getById);
router.put('/:id/resolve', authorize('ADMIN', 'OWNER'), violationController.resolve);

export default router;