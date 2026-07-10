import api from './axios';

export const userApi = {
  /** GET /api/users (ADMIN, HR) */
  getUsers: (params) => api.get('/api/users', { params }),

  /** GET /api/users/me */
  getMe: () => api.get('/api/users/me'),

  /** PUT /api/users/me */
  updateMe: (data) => api.put('/api/users/me', data),

  /** GET /api/users/{id} */
  getById: (id) => api.get(`/api/users/${id}`),

  /** POST /api/users (ADMIN) */
  createUser: (data) => api.post('/api/users', data),

  /** PUT /api/users/{id} (ADMIN) */
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),

  /** PATCH /api/users/{id}/deactivate (ADMIN) */
  deactivateUser: (id) => api.patch(`/api/users/${id}/deactivate`),

  /** POST /api/users/{id}/roles (ADMIN) */
  assignRole: (id, data) => api.post(`/api/users/${id}/roles`, data),

  /** DELETE /api/users/{id}/roles/{roleId} (ADMIN) */
  removeRole: (id, roleId) => api.delete(`/api/users/${id}/roles/${roleId}`),
};
