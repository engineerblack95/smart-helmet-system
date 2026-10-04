import { helmetService } from '../services/helmetService.js';

export const helmetController = {
  async getAll(req, res, next) {
    try {
      const helmets = await helmetService.getAll(req.query);
      res.json({ success: true, data: helmets });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const helmet = await helmetService.getById(req.params.id);
      res.json({ success: true, data: helmet });
    } catch (error) {
      error.statusCode = 404;
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const helmet = await helmetService.create(req.body);
      res.status(201).json({ success: true, data: helmet });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const helmet = await helmetService.update(req.params.id, req.body);
      res.json({ success: true, data: helmet });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await helmetService.delete(req.params.id);
      res.json({ success: true, message: 'Helmet deleted' });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await helmetService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};