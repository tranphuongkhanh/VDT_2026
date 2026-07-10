import api from './axios';

export const requestApi = {
  /** GET /api/requests — danh sách yêu cầu của tôi */
  getMyRequests: (params) => api.get('/api/requests', { params }),

  /** POST /api/requests — tạo yêu cầu mới (DRAFT) */
  createRequest: (data) => api.post('/api/requests', data),

  /** GET /api/requests/{id} — chi tiết yêu cầu */
  getRequestById: (id) => api.get(`/api/requests/${id}`),

  /** PUT /api/requests/{id} — cập nhật yêu cầu */
  updateRequest: (id, data) => api.put(`/api/requests/${id}`, data),

  /** POST /api/requests/{id}/submit — nộp yêu cầu */
  submitRequest: (id, data) => api.post(`/api/requests/${id}/submit`, data ?? {}),

  /** PATCH /api/requests/{id}/cancel — hủy yêu cầu */
  cancelRequest: (id) => api.patch(`/api/requests/${id}/cancel`),



  /** POST /api/requests/{id}/approve — phê duyệt */
  approveRequest: (id, data) => api.post(`/api/requests/${id}/approve`, data ?? {}),

  /** POST /api/requests/{id}/reject — từ chối */
  rejectRequest: (id, data) => api.post(`/api/requests/${id}/reject`, data ?? {}),

  /** POST /api/requests/{id}/return — trả lại để bổ sung */
  returnRequest: (id, data) => api.post(`/api/requests/${id}/return`, data ?? {}),

  /** GET /api/requests/pending-my-approval — yêu cầu đang chờ tôi duyệt */
  getPendingApprovals: () => api.get('/api/requests/pending-my-approval'),

  /** GET /api/requests/all — toàn bộ yêu cầu (ADMIN/HR) */
  getAllRequests: (params) => api.get('/api/requests/all', { params }),

  /** GET /api/requests/{id}/logs — lịch sử trạng thái */
  getRequestLogs: (id) => api.get(`/api/requests/${id}/logs`),

  /** GET /api/requests/{id}/approvals — timeline phê duyệt */
  getRequestApprovals: (id) => api.get(`/api/requests/${id}/approvals`),
};
