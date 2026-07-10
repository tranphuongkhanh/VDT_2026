import api from './axios';

export const dashboardApi = {
  /** GET /api/dashboard/me — thống kê cá nhân */
  getPersonalDashboard: () => api.get('/api/dashboard/me'),

  /** GET /api/dashboard/system — thống kê hệ thống (ADMIN) */
  getSystemDashboard: () => api.get('/api/dashboard/system'),
};
