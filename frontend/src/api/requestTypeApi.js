import api from './axios';

export const requestTypeApi = {
  /** GET /api/request-types */
  getAll: (params) => api.get('/api/request-types', { params }),

  /** GET /api/request-types/{id} */
  getById: (id) => api.get(`/api/request-types/${id}`),

  /** POST /api/request-types */
  create: (data) => api.post('/api/request-types', data),

  /** PUT /api/request-types/{id} */
  update: (id, data) => api.put(`/api/request-types/${id}`, data),

  /** PATCH /api/request-types/{id}/deactivate */
  deactivate: (id) => api.patch(`/api/request-types/${id}/deactivate`),

  // --- Form specific endpoints ---

  /** GET /api/request-types/{id}/form */
  getActiveForm: (id) => api.get(`/api/request-types/${id}/form`),

  /** POST /api/request-types/{id}/forms */
  createForm: (id, data) => api.post(`/api/request-types/${id}/forms`, data),

  /** GET /api/request-types/{id}/workflow */
  getActiveWorkflow: (id) => api.get(`/api/request-types/${id}/workflow`),

  /** POST /api/request-types/{id}/workflows */
  createWorkflow: (id, data) => api.post(`/api/request-types/${id}/workflows`, data),
};
