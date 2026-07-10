import api from './axios';

export const categoryApi = {
  /** GET /api/categories */
  getAll: () => api.get('/api/categories'),

  /** POST /api/categories */
  create: (data) => api.post('/api/categories', data),

  /** PUT /api/categories/{id} */
  update: (id, data) => api.put(`/api/categories/${id}`, data),

  /** PATCH /api/categories/{id}/deactivate */
  deactivate: (id) => api.patch(`/api/categories/${id}/deactivate`),
};
