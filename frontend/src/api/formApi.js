import api from './axios';

export const formApi = {
  /** GET /api/forms/{id} */
  getById: (id) => api.get(`/api/forms/${id}`),

  /** PATCH /api/forms/{id}/activate */
  activate: (id) => api.patch(`/api/forms/${id}/activate`),
};
