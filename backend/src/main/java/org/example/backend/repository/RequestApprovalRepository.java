package org.example.backend.repository;

import org.example.backend.entity.RequestApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RequestApprovalRepository extends JpaRepository<RequestApproval, Long> {
    List<RequestApproval> findByRequestId(Long requestId);
    List<RequestApproval> findByApproverId(Long approverId);
}
