import { bikeService } from '../services/bikeService.js';

export const bikeController = {
  async getAll(req, res, next) {
    try {
      const bikes = await bikeService.getAll(req.query);
      res.json({ success: true, data: bikes });
    } catch (error) { next(error); }
  },

  async getById(req, res, next) {
    try {
      const bike = await bikeService.getById(req.params.id);
      res.json({ success: true, data: bike });
    } catch (error) { error.statusCode = 404; next(error); }
  },

  async create(req, res, next) {
    try {
      const bike = await bikeService.create(req.body);
      res.status(201).json({ success: true, data: bike });
    } catch (error) { next(error); }
  },

  async update(req, res, next) {
    try {
      const bike = await bikeService.update(req.params.id, req.body);
      res.json({ success: true, data: bike });
    } catch (error) { next(error); }
  },

  async delete(req, res, next) {
    try {
      await bikeService.delete(req.params.id);
      res.json({ success: true, message: 'Bike deleted' });
    } catch (error) { next(error); }
  },

  async getStats(req, res, next) {
    try {
      const stats = await bikeService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  },
};