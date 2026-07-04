package org.example.backend.enums;

public enum ActionOnReject {
    // Hành động khi từ chối yêu cầu
    BACK_TO_STEP, // trả về bước trước đó
    REJECT, // kết thúc từ chối
    BACK_TO_REQUESTER // trả về người tạo
}
