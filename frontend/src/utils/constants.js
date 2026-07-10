export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const REQUEST_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
};

export const REQUEST_STATUS_LABEL = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  IN_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  RETURNED: 'Trả lại',
  CLOSED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const REQUEST_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

export const REQUEST_PRIORITY_LABEL = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

// Chỉ có 2 role hệ thống (README § Phân quyền theo role)
// USER: mọi user đều có — không cần gán
// ADMIN: toàn quyền hệ thống
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  USER: 'ROLE_USER', // implicit, mọi user đã đăng nhập đều có
};

// Role nghiệp vụ dùng trong workflow (dynamic, do admin tự tạo)
// Không dùng để kiểm soát route trên frontend nữa.
// Backend tự xử lý approver logic tại /api/requests/pending-my-approval
