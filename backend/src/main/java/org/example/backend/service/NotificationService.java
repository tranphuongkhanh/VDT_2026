package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.response.NotificationDto;
import org.example.backend.dto.response.UnreadCountResponse;
import org.example.backend.entity.Notification;
import org.example.backend.entity.Request;
import org.example.backend.entity.User;
import org.example.backend.entity.WorkflowStep;
import org.example.backend.enums.NotificationType;
import org.example.backend.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApproverResolverService approverResolverService;

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return new UnreadCountResponse(count);
    }

    @Transactional
    public void markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now();

        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(now);
        }

        if (!unreadNotifications.isEmpty()) {
            notificationRepository.saveAll(unreadNotifications);
        }
    }

    @Transactional
    public Notification createAndSendNotification(Notification notification) {
        Notification savedNotification = notificationRepository.save(notification);
        NotificationDto notificationDto = NotificationDto.fromEntity(savedNotification);

        String destination = "/queue/notifications";
        messagingTemplate.convertAndSendToUser(
                savedNotification.getUser().getUsername(),
                destination,
                notificationDto
        );

        return savedNotification;
    }

    /**
     * Gửi thông báo PENDING_APPROVAL đến tất cả approver của bước hiện tại.
     */
    @Transactional
    public void notifyApprovers(Request request, WorkflowStep step) {
        List<User> approvers = approverResolverService.findApproversForStep(step, request.getRequester());

        String title = String.format("[Chờ duyệt] %s - %s", request.getRequestNo(), request.getTitle());
        String content = String.format("Yêu cầu '%s' đang chờ bạn phê duyệt tại bước '%s'.",
                request.getTitle(), step.getName());

        for (User approver : approvers) {
            Notification notification = Notification.builder()
                    .user(approver)
                    .request(request)
                    .type(NotificationType.PENDING_APPROVAL)
                    .title(title)
                    .content(content)
                    .build();
            createAndSendNotification(notification);
        }
    }

    /**
     * Gửi thông báo kết quả phê duyệt về cho requester.
     */
    @Transactional
    public void notifyRequester(Request request, NotificationType type, String comment) {
        String title;
        String content;

        switch (type) {
            case REQUEST_APPROVED -> {
                title = String.format("[Đã duyệt] %s - %s", request.getRequestNo(), request.getTitle());
                content = String.format("Yêu cầu '%s' của bạn đã được phê duyệt.", request.getTitle());
            }
            case REQUEST_REJECTED -> {
                title = String.format("[Bị từ chối] %s - %s", request.getRequestNo(), request.getTitle());
                content = String.format("Yêu cầu '%s' của bạn đã bị từ chối.%s",
                        request.getTitle(),
                        comment != null ? " Lý do: " + comment : "");
            }
            case REQUEST_RETURNED -> {
                title = String.format("[Trả lại] %s - %s", request.getRequestNo(), request.getTitle());
                content = String.format("Yêu cầu '%s' đã được trả lại để bổ sung thông tin.%s",
                        request.getTitle(),
                        comment != null ? " Ghi chú: " + comment : "");
            }
            default -> {
                title = String.format("[Thông báo] %s", request.getRequestNo());
                content = String.format("Có cập nhật mới về yêu cầu '%s'.", request.getTitle());
            }
        }

        Notification notification = Notification.builder()
                .user(request.getRequester())
                .request(request)
                .type(type)
                .title(title)
                .content(content)
                .build();

        createAndSendNotification(notification);
    }
}
