import api from './api';

export const sensorService = {
  async getLive(helmetCode) {
    const { data } = await api.get(`/sensor/live/${helmetCode}`);
    return data;
  },
  async getHistory(helmetCode, limit = 100) {
    const { data } = await api.get(`/sensor/history/${helmetCode}`, { params: { limit } });
    return data;
  },
  async getStats(helmetCode) {
    const { data } = await api.get(`/sensor/stats/${helmetCode}`);
    return data;
  },
};