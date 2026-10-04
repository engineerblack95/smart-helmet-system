import { sensorService } from '../services/sensorService.js';

export const sensorController = {
  /**
   * POST /api/sensor/data
   * Receives data from ESP32 (authenticated via x-api-key)
   */
  async receiveData(req, res, next) {
    try {
      const result = await sensorService.processSensorData(req.body);
      res.status(200).json({
        success: true,
        message: 'Sensor data processed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getLive(req, res, next) {
    try {
      const data = await sensorService.getLiveData(req.params.helmetCode);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },

  async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const data = await sensorService.getHistory(req.params.helmetCode, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },

  async getStats(req, res, next) {
    try {
      const data = await sensorService.getStats(req.params.helmetCode);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
};