package org.example.backend.enums;

public enum LogAction {
    // Các sự kiện thay đổi trạng thái trong nhật ký
    CREATED, // Tạo mới yêu cầu
    UPDATED, // Cập nhật yêu cầu
    SUBMITTED, // Nộp yêu cầu
    STEP_ADVANCED, // Chuyển bước
    APPROVED, // Duyệt yêu cầu
    REJECTED, // Từ chối yêu cầu
    RETURNED, // Trả lại yêu cầu
    DELEGATED, // Ủy quyền yêu cầu
    CANCELLED, // Hủy yêu cầu
    SYSTEM_TIMEOUT // Quá hạn xử lý yêu cầu
}
