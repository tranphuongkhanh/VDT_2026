package org.example.backend.dto.request;

import org.example.backend.enums.ActionOnApprove;
import org.example.backend.enums.ApproverType;
import org.example.backend.enums.RoleApprovalMode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkflowStepRequest {
    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotNull(message = "Approver type cannot be null")
    private ApproverType approverType;

    private Long approverRefId;

    @NotNull(message = "Action on approve cannot be null")
    private ActionOnApprove actionOnApprove;

    private RoleApprovalMode roleApprovalMode;

    private Integer roleApprovalThreshold;

    private Integer timeLimitHours;

    private Boolean notifyOnEnter;

    private String description;
}
