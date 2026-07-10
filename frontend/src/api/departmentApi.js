import api from './axios';

export const departmentApi = {
  /** GET /api/departments */
  getTree: () => api.get('/api/departments'),

  /** POST /api/departments */
  create: (data) => api.post('/api/departments', data),

  /** PUT /api/departments/{id} */
  update: (id, data) => api.put(`/api/departments/${id}`, data),

  /** DELETE /api/departments/{id} */
  delete: (id) => api.delete(`/api/departments/${id}`),
};
