import api from './axios';

export const reportApi = {
  /** GET /api/reports/requests */
  getRequestsReport: (params) => api.get('/api/reports/requests', { params }),

  /** GET /api/reports/audit-log */
  getAuditLogReport: (params) => api.get('/api/reports/audit-log', { params }),
};
