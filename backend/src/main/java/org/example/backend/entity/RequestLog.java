package org.example.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;

import org.example.backend.enums.LogAction;
import org.example.backend.enums.RequestStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    // Người thực hiện hành động: null = hệ thống tự động
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    // Tên sự kiện: CREATED, SUBMITTED, STEP_ADVANCED, APPROVED, REJECTED, RETURNED,
    // CANCELLED, SYSTEM_TIMEOUT
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LogAction action;

    // Trạng thái trước khi thay đổi
    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private RequestStatus oldStatus;

    // Trạng thái sau khi thay đổi
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private RequestStatus newStatus;

    // Bước trước khi chuyển (số thứ tự)
    @Column(name = "step_from")
    private Integer stepFrom;

    // Bước sau khi chuyển (số thứ tự)
    @Column(name = "step_to")
    private Integer stepTo;

    // Thông tin bổ sung dạng JSON (VD: lý do timeout, thông tin trigger)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private JsonNode metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
