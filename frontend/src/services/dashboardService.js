import api from './api';

export const dashboardService = {
  async getOverview() {
    const { data } = await api.get('/dashboard/overview');
    return data;
  },
  async getViolationTrends() {
    const { data } = await api.get('/dashboard/violations/trends');
    return data;
  },
};