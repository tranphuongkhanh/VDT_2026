import api from './axios';

export const roleApi = {
  /** GET /api/roles (ADMIN) */
  getAll: () => api.get('/api/roles'),

  /** POST /api/roles (ADMIN) */
  create: (data) => api.post('/api/roles', data),

  /** PUT /api/roles/{id} (ADMIN) */
  update: (id, data) => api.put(`/api/roles/${id}`, data),
};
