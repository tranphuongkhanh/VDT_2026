package org.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.Notification;
import org.example.backend.enums.NotificationChannel;
import org.example.backend.enums.NotificationType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Long requestId;
    private NotificationType type;
    private String title;
    private String content;
    private Boolean isRead;
    private LocalDateTime readAt;
    private NotificationChannel channel;
    private LocalDateTime createdAt;

    public static NotificationDto fromEntity(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .requestId(notification.getRequest() != null ? notification.getRequest().getId() : null)
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .channel(notification.getChannel())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
