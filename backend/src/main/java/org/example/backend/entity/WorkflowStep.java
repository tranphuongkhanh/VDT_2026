package org.example.backend.entity;

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

    @Column(name = "approver_type", nullable = false, length = 30)
    private String approverType;

    @Column(name = "approver_ref_id")
    private Long approverRefId;

    @Column(name = "action_on_approve", nullable = false, length = 100)
    private String actionOnApprove;

    @Column(name = "action_on_reject", nullable = false, length = 100)
    private String actionOnReject;

    @Column(name = "is_parallel")
    @Builder.Default
    private Boolean isParallel = false;

    @Column(name = "parallel_threshold")
    @Builder.Default
    private Integer parallelThreshold = 1;

    @Column(name = "time_limit_hours")
    private Integer timeLimitHours;

    @Column(name = "notify_on_enter")
    @Builder.Default
    private Boolean notifyOnEnter = true;

    @Column(columnDefinition = "TEXT")
    private String description;
}
