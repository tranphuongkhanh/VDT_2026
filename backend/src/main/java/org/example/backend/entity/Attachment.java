package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    // Đường dẫn/key lưu trên storage
    @Column(name = "storage_key", nullable = false, length = 1000)
    private String storageKey;

    // MIME type (VD: application/pdf, image/jpeg). Dùng để validate và hiển thị
    // icon phù hợp
    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    // Kích thước tính bằng byte
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    // Soft delete: file bị xóa khỏi giao diện nhưng vẫn giữ trên storage trong thời
    // gian lưu trữ quy định
    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
