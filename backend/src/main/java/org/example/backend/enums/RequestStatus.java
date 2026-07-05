package org.example.backend.enums;

public enum RequestStatus {
    // Trạng thái yêu cầu
    DRAFT, // bản nháp
    SUBMITTED, // đã nộp
    IN_REVIEW, // đang xem xét
    APPROVED, // đã duyệt
    REJECTED, // đã từ chối
    RETURNED, // trả lại
    CLOSED, // đã hoàn thành
    CANCELLED // đã hủy
}
