import { violationService } from '../services/violationService.js';

export const violationController = {
  async getAll(req, res, next) {
    try {
      const data = await violationService.getAll(req.query);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },

  async getById(req, res, next) {
    try {
      const data = await violationService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (error) { error.statusCode = 404; next(error); }
  },

  async resolve(req, res, next) {
    try {
      const data = await violationService.resolve(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },

  async getStats(req, res, next) {
    try {
      const data = await violationService.getStats();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
};