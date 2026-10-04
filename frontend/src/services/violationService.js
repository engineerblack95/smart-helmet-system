import api from './api';

export const violationService = {
  async getAll(params = {}) {
    const { data } = await api.get('/violations', { params });
    return data;
  },
  async getStats() {
    const { data } = await api.get('/violations/stats');
    return data;
  },
  async resolve(id) {
    const { data } = await api.put(`/violations/${id}/resolve`);
    return data;
  },
};