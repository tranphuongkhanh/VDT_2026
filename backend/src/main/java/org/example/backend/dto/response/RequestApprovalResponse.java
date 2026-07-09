package org.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.backend.entity.RequestApproval;
import org.example.backend.enums.ApprovalAction;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class RequestApprovalResponse {

    private Long id;
    private Long requestId;

    // Step info
    private Long workflowStepId;
    private String workflowStepName;
    private Integer workflowStepOrder;

    // Approver info
    private Long approverId;
    private String approverUsername;
    private String approverFullName;

    private ApprovalAction action;
    private String comment;
    private LocalDateTime actedAt;
    private String ipAddress;

    public static RequestApprovalResponse fromEntity(RequestApproval a) {
        return RequestApprovalResponse.builder()
                .id(a.getId())
                .requestId(a.getRequest().getId())
                .workflowStepId(a.getWorkflowStep().getId())
                .workflowStepName(a.getWorkflowStep().getName())
                .workflowStepOrder(a.getWorkflowStep().getStepOrder())
                .approverId(a.getApprover().getId())
                .approverUsername(a.getApprover().getUsername())
                .approverFullName(a.getApprover().getFullName())
                .action(a.getAction())
                .comment(a.getComment())
                .actedAt(a.getActedAt())
                .ipAddress(a.getIpAddress())
                .build();
    }
}
