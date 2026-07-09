package org.example.backend.repository;

import org.example.backend.entity.RequestApproval;
import org.example.backend.enums.ApprovalAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestApprovalRepository extends JpaRepository<RequestApproval, Long> {

    List<RequestApproval> findByRequestId(Long requestId);

    List<RequestApproval> findByApproverId(Long approverId);

    // Lấy tất cả approval của một bước cụ thể trong request
    List<RequestApproval> findByRequestIdAndWorkflowStepId(Long requestId, Long workflowStepId);

    // Đếm số người đã approve một bước (dùng cho ROLE/THRESHOLD mode)
    long countByRequestIdAndWorkflowStepIdAndAction(Long requestId, Long workflowStepId, ApprovalAction action);

    // Kiểm tra xem người dùng đã hành động trên bước này chưa
    boolean existsByRequestIdAndWorkflowStepIdAndApproverId(Long requestId, Long workflowStepId, Long approverId);
}
