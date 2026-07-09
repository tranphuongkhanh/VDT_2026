package org.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.backend.enums.ApproverType;
import org.example.backend.enums.RequestPriority;
import org.example.backend.enums.RequestStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class PendingApprovalResponse {

    // Request summary
    private Long requestId;
    private String requestNo;
    private String title;
    private RequestStatus status;
    private RequestPriority priority;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;

    // Requester info
    private Long requesterId;
    private String requesterFullName;
    private String requesterDepartment;

    // Request type
    private Long requestTypeId;
    private String requestTypeName;

    // Current step info
    private Long currentStepId;
    private String currentStepName;
    private Integer currentStepOrder;
    private ApproverType approverType;
    private Integer timeLimitHours;
}
