package org.example.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;

import org.example.backend.enums.RequestPriority;
import org.example.backend.enums.RequestStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Số yêu cầu sinh tự động theo format: {TYPE}-{YEAR}-{SEQ} (VD:
    // LEAVE-2025-00142)
    @Column(name = "request_no", nullable = false, unique = true, length = 50)
    private String requestNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_type_id", nullable = false)
    private RequestType requestType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private Form form;

    @Column(name = "current_step")
    @Builder.Default
    private Integer currentStep = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RequestStatus status = RequestStatus.DRAFT;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_data", nullable = false)
    private JsonNode formData;

    @Column(nullable = false, length = 500)
    private String title;

    // Mức độ ưu tiên: LOW, NORMAL, HIGH, URGENT
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private RequestPriority priority = RequestPriority.NORMAL;

    // Thời điểm nộp chính thức (chuyển từ DRAFT sang SUBMITTED)
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    // Thời điểm hoàn thành (APPROVED hoặc REJECTED)
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Ngày cần xử lý xong
    @Column(name = "due_date")
    private LocalDate dueDate;

    // Ghi chú bổ sung của người tạo khi submit
    @Column(columnDefinition = "TEXT")
    private String note;

    // Thời điểm tạo bản nháp (DRAFT)
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
