package org.example.backend.enums;

public enum NotificationType {
    // Phân loại thông báo gửi đến người dùng
    PENDING_APPROVAL, // Thông báo chờ phê duyệt
    REQUEST_APPROVED, // Thông báo yêu cầu được duyệt
    REQUEST_REJECTED, // Thông báo yêu cầu bị từ chối
    REQUEST_RETURNED, // Thông báo yêu cầu được trả lại
    REQUEST_CANCELLED, // Thông báo yêu cầu được hủy
    DELEGATED_TASK, // Thông báo công việc được giao cho bạn
    DELEGATION_ACTIVATED, // Thông báo ủy quyền được kích hoạt
    DELEGATION_REVOKED, // Thông báo ủy quyền đã thu hồi
    DELEGATION_EXPIRED, // Thông báo ủy quyền đã hết hạn
    REMINDER, // Thông báo nhắc nhở
    SYSTEM // Thông báo hệ thống
}
