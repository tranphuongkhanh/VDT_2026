package org.example.backend.repository;

import org.example.backend.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    List<Workflow> findByRequestTypeId(Long requestTypeId);
    Optional<Workflow> findByRequestTypeIdAndIsActiveTrue(Long requestTypeId);
}
