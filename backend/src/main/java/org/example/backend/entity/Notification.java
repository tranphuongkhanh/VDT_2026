package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import org.example.backend.enums.NotificationChannel;
import org.example.backend.enums.NotificationType;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private Request request;

    // Loại thông báo: PENDING_APPROVAL (cần duyệt), REQUEST_APPROVED,
    // REQUEST_REJECTED, REQUEST_RETURNED, REMINDER, SYSTEM
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    // Thời điểm người dùng mở đọc thông báo
    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Kênh gửi: IN_APP (trong hệ thống), EMAIL, PUSH (mobile). Một notification có
    // thể gửi qua nhiều kênh
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private NotificationChannel channel = NotificationChannel.IN_APP;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
