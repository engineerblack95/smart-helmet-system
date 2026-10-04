import express from 'express';
import { body } from 'express-validator';
import { helmetController } from '../controllers/helmetController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', helmetController.getAll);
router.get('/stats', helmetController.getStats);
router.get('/:id', helmetController.getById);

router.post(
  '/',
  authorize('ADMIN', 'OWNER'),
  [body('helmetCode').notEmpty().withMessage('Helmet code required')],
  validate,
  helmetController.create
);

router.put('/:id', authorize('ADMIN', 'OWNER'), helmetController.update);
router.delete('/:id', authorize('ADMIN'), helmetController.delete);

export default router;