import api from './axios';

export const notificationApi = {
  /** GET /api/notifications */
  getAll: (params) => api.get('/api/notifications', { params }),

  /** GET /api/notifications/unread-count */
  getUnreadCount: () => api.get('/api/notifications/unread-count'),

  /** PATCH /api/notifications/{id}/read */
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),

  /** PATCH /api/notifications/read-all */
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
};
