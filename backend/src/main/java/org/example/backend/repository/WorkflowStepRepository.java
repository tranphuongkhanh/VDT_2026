package org.example.backend.repository;

import org.example.backend.entity.WorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStep, Long> {

    List<WorkflowStep> findByWorkflowIdOrderByStepOrderAsc(Long workflowId);

    // Lấy bước theo workflow và thứ tự bước
    Optional<WorkflowStep> findByWorkflowIdAndStepOrder(Long workflowId, Integer stepOrder);
}
