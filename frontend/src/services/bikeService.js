import api from './api';

export const bikeService = {
  async getAll() {
    const { data } = await api.get('/bikes');
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/bikes/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/bikes', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/bikes/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/bikes/${id}`);
    return data;
  },
  async getStats() {
    const { data } = await api.get('/bikes/stats');
    return data;
  },
};