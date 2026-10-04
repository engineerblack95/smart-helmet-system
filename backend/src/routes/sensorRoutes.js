import express from 'express';
import { body } from 'express-validator';
import { sensorController } from '../controllers/sensorController.js';
import { authenticate, authenticateDevice } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

// ============================================================
// DEVICE ENDPOINT (ESP32 → Cloud) - uses x-api-key
// ============================================================
router.post(
  '/data',
  authenticateDevice,
  [
    body('helmetCode').notEmpty().withMessage('helmetCode required'),
    body('bikeCode').notEmpty().withMessage('bikeCode required'),
    body('worn').isBoolean().withMessage('worn must be boolean'),
    body('alcoholLevel').isInt({ min: 0 }).withMessage('alcoholLevel required'),
  ],
  validate,
  sensorController.receiveData
);

// ============================================================
// DASHBOARD ENDPOINTS (React → Cloud) - uses JWT
// ============================================================
router.get('/live/:helmetCode', authenticate, sensorController.getLive);
router.get('/history/:helmetCode', authenticate, sensorController.getHistory);
router.get('/stats/:helmetCode', authenticate, sensorController.getStats);

export default router;