package org.example.backend.dto.response;

import org.example.backend.enums.ActionOnApprove;
import org.example.backend.enums.ApproverType;
import org.example.backend.enums.RoleApprovalMode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepResponse {
    private Long id;
    private Long workflowId;
    private Integer stepOrder;
    private String name;
    private ApproverType approverType;
    private Long approverRefId;
    private ActionOnApprove actionOnApprove;
    private RoleApprovalMode roleApprovalMode;
    private Integer roleApprovalThreshold;
    private Integer timeLimitHours;
    private Boolean notifyOnEnter;
    private String description;
}
