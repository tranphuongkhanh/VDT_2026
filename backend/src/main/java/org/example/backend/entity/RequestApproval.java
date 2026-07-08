package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import org.example.backend.enums.ApprovalAction;

@Entity
@Table(name = "request_approvals", uniqueConstraints = {
        @UniqueConstraint(name = "uq_request_step_approver", columnNames = { "request_id", "workflow_step_id",
                "approver_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_step_id", nullable = false)
    private WorkflowStep workflowStep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private User approver;

    // Hành động: APPROVE, REJECT, RETURN, DELEGATE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalAction action;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "acted_at", nullable = false)
    @Builder.Default
    private LocalDateTime actedAt = LocalDateTime.now();

    // IP của người thực hiện hành động
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}
