package org.example.backend.entity;

import org.example.backend.enums.ActionOnApprove;
import org.example.backend.enums.ApproverType;
import org.example.backend.enums.RoleApprovalMode;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workflow_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(nullable = false, length = 255)
    private String name;

    // Loại người duyệt: USER (cụ thể), ROLE (theo vai trò), ...
    @Enumerated(EnumType.STRING)
    @Column(name = "approver_type", nullable = false, length = 30)
    private ApproverType approverType;

    // ID tham chiếu: user_id nếu type=USER, role_id nếu type=ROLE...
    @Column(name = "approver_ref_id")
    private Long approverRefId;

    // Hành động khi duyệt: NEXT_STEP (chuyển bước tiếp), COMPLETE (hoàn thành),
    // BACK_TO_STEP:n (trả về bước n)
    @Enumerated(EnumType.STRING)
    @Column(name = "action_on_approve", nullable = false, length = 100)
    private ActionOnApprove actionOnApprove;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_approval_mode", length = 20)
    private RoleApprovalMode roleApprovalMode;

    @Column(name = "role_approval_threshold")
    private Integer roleApprovalThreshold;

    // Giới hạn thời gian xử lý (giờ). Quá hạn sẽ gửi cảnh báo hoặc escalate theo
    // cấu hình
    @Column(name = "time_limit_hours")
    private Integer timeLimitHours;

    // Gửi thông báo cho approver khi yêu cầu đến bước này
    @Column(name = "notify_on_enter")
    @Builder.Default
    private Boolean notifyOnEnter = true;

    // Hướng dẫn nghiệp vụ cho approver tại bước này
    @Column(columnDefinition = "TEXT")
    private String description;
}
