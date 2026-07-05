package org.example.backend.enums;

public enum ApproverType {
    // Loại người duyệt trong các bước của quy trình
    USER, // cụ thể một user nào đó
    ROLE, // theo vai trò nào đó
    DEPARTMENT_HEAD, // trưởng phòng người tạo
    DIRECT_MANAGER, // quản lý trực tiếp
    SPECIFIC_DEPARTMENT_HEAD // trưởng một phòng ban cụ thể khác
}
