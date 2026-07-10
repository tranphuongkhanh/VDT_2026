import api from './axios';

export const attachmentApi = {
  /** POST /api/requests/{id}/attachments — Tải file lên */
  upload: (requestId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/requests/${requestId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /** GET /api/requests/{id}/attachments — Lấy danh sách file của yêu cầu */
  getByRequestId: (requestId) => api.get(`/api/requests/${requestId}/attachments`),

  /** DELETE /api/attachments/{id} — Xóa file */
  delete: (id) => api.delete(`/api/attachments/${id}`),

  /** Trực tiếp tải file về bằng cách lấy blob */
  downloadFile: async (attachmentId, fileName) => {
    const response = await api.get(`/api/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
