import api from './api';

export const helmetService = {
  async getAll() {
    const { data } = await api.get('/helmets');
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/helmets/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/helmets', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/helmets/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/helmets/${id}`);
    return data;
  },
  async getStats() {
    const { data } = await api.get('/helmets/stats');
    return data;
  },
};