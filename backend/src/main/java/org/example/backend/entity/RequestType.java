package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã định danh kỹ thuật viết HOA (VD: NGHI_PHEP, MUA_SAM)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    // Tên hiển thị người dùng nhìn thấy khi tạo yêu cầu mới
    @Column(nullable = false, length = 255)
    private String name;

    // Mô tả chi tiết loại yêu cầu, điều kiện áp dụng, quy trình duyệt
    @Column(columnDefinition = "TEXT")
    private String description;

    // Icon hiển thị trên giao diện người dùng
    @Column(length = 100)
    private String icon;

    // Nhóm loại yêu cầu (VD: "Nhân sự", "Mua sắm", "Công tác", "Tài chính")
    @Column(length = 50)
    private String category;

    // Loại yêu cầu không còn dùng được ẩn đi nhưng dữ liệu cũ vẫn truy cập được
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // Sắp xếp hiển thị loại yêu cầu
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
