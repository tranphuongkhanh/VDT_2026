import api from './axios';

export const workflowApi = {
  /** GET /api/workflows (ADMIN) */
  getAll: () => api.get('/api/workflows'),

  /** GET /api/workflows/{id} */
  getById: (id) => api.get(`/api/workflows/${id}`),

  /** POST /api/workflows */
  create: (data) => api.post('/api/workflows', data),

  /** PUT /api/workflows/{id} */
  update: (id, data) => api.put(`/api/workflows/${id}`, data),

  /** PATCH /api/workflows/{id}/activate */
  activate: (id) => api.patch(`/api/workflows/${id}/activate`),

  /** GET /api/workflows/{id}/steps */
  getSteps: (id) => api.get(`/api/workflows/${id}/steps`),

  /** POST /api/workflows/{id}/steps */
  addStep: (id, data) => api.post(`/api/workflows/${id}/steps`, data),

  /** PUT /api/workflows/{id}/steps/{stepId} */
  updateStep: (id, stepId, data) => api.put(`/api/workflows/${id}/steps/${stepId}`, data),

  /** DELETE /api/workflows/{id}/steps/{stepId} */
  deleteStep: (id, stepId) => api.delete(`/api/workflows/${id}/steps/${stepId}`),

  /** PUT /api/workflows/{id}/steps/reorder */
  reorderSteps: (id, data) => api.put(`/api/workflows/${id}/steps/reorder`, data),
};
