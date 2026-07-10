import api from './axios';

export const authApi = {
  /** POST /api/auth/login */
  login: (credentials) => api.post('/api/auth/login', credentials),

  /** POST /api/auth/refresh */
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),

  /** POST /api/auth/logout */
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),

  /** POST /api/auth/forgot-password */
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),

  /** POST /api/auth/reset-password */
  resetPassword: (data) => api.post('/api/auth/reset-password', data),

  /** POST /api/auth/change-password */
  changePassword: (data) => api.post('/api/auth/change-password', data),
};
