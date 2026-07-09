package org.example.backend.repository;

import org.example.backend.entity.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {

    List<RequestLog> findByRequestIdOrderByCreatedAtAsc(Long requestId);
}
