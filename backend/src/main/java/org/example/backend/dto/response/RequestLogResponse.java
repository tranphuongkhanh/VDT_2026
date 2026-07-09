package org.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.backend.entity.RequestLog;
import org.example.backend.enums.LogAction;
import org.example.backend.enums.RequestStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class RequestLogResponse {

    private Long id;
    private Long requestId;

    // Actor (null = hệ thống tự động)
    private Long actorId;
    private String actorUsername;
    private String actorFullName;

    private LogAction action;
    private RequestStatus oldStatus;
    private RequestStatus newStatus;
    private Integer stepFrom;
    private Integer stepTo;
    private LocalDateTime createdAt;

    public static RequestLogResponse fromEntity(RequestLog log) {
        return RequestLogResponse.builder()
                .id(log.getId())
                .requestId(log.getRequest().getId())
                .actorId(log.getActor() != null ? log.getActor().getId() : null)
                .actorUsername(log.getActor() != null ? log.getActor().getUsername() : null)
                .actorFullName(log.getActor() != null ? log.getActor().getFullName() : null)
                .action(log.getAction())
                .oldStatus(log.getOldStatus())
                .newStatus(log.getNewStatus())
                .stepFrom(log.getStepFrom())
                .stepTo(log.getStepTo())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
