import express from 'express';
import { body } from 'express-validator';
import { bikeController } from '../controllers/bikeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', bikeController.getAll);
router.get('/stats', bikeController.getStats);
router.get('/:id', bikeController.getById);

router.post(
  '/',
  authorize('ADMIN', 'OWNER'),
  [body('bikeCode').notEmpty().withMessage('Bike code required')],
  validate,
  bikeController.create
);

router.put('/:id', authorize('ADMIN', 'OWNER'), bikeController.update);
router.delete('/:id', authorize('ADMIN'), bikeController.delete);

export default router;