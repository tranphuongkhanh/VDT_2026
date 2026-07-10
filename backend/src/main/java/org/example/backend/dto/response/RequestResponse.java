package org.example.backend.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.backend.entity.Request;
import org.example.backend.enums.RequestPriority;
import org.example.backend.enums.RequestStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class RequestResponse {

    private List<ResolvedStep> workflowSteps;

    @Getter
    @Setter
    @Builder
    public static class ResolvedStep {
        private Long id;
        private Integer stepOrder;
        private String name;
        private String approverType;
        private List<String> resolvedApprovers;
        private String status; // "APPROVED", "REJECTED", "RETURNED", "PENDING", "NOT_STARTED"
    }

    private Long id;
    private String requestNo;

    // Request Type
    private Long requestTypeId;
    private String requestTypeName;

    // Requester
    private Long requesterId;
    private String requesterUsername;
    private String requesterFullName;
    private String requesterDepartment;

    // Workflow
    private Long workflowId;
    private String workflowName;

    // Form
    private Long formId;

    private Integer currentStep;
    private RequestStatus status;
    private JsonNode formData;
    private String title;
    private RequestPriority priority;
    private String note;

    private LocalDateTime submittedAt;
    private LocalDateTime completedAt;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RequestResponse fromEntity(Request r) {
        return RequestResponse.builder()
                .id(r.getId())
                .requestNo(r.getRequestNo())
                .requestTypeId(r.getRequestType().getId())
                .requestTypeName(r.getRequestType().getName())
                .requesterId(r.getRequester().getId())
                .requesterUsername(r.getRequester().getUsername())
                .requesterFullName(r.getRequester().getFullName())
                .requesterDepartment(r.getRequester().getDepartment() != null
                        ? r.getRequester().getDepartment().getName() : null)
                .workflowId(r.getWorkflow().getId())
                .workflowName(r.getWorkflow().getName())
                .formId(r.getForm().getId())
                .currentStep(r.getCurrentStep())
                .status(r.getStatus())
                .formData(r.getFormData())
                .title(r.getTitle())
                .priority(r.getPriority())
                .note(r.getNote())
                .submittedAt(r.getSubmittedAt())
                .completedAt(r.getCompletedAt())
                .dueDate(r.getDueDate())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
