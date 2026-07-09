package org.example.backend.repository;

import org.example.backend.entity.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {

    List<RequestLog> findByRequestIdOrderByCreatedAtAsc(Long requestId);

    @Query("SELECT l FROM RequestLog l WHERE " +
           "(:requestId IS NULL OR l.request.id = :requestId) " +
           "AND (:actorId IS NULL OR l.actor.id = :actorId) " +
           "AND (:action IS NULL OR l.action = :action) " +
           "ORDER BY l.createdAt DESC")
    org.springframework.data.domain.Page<RequestLog> findAllWithFilters(
            @org.springframework.data.repository.query.Param("requestId") Long requestId,
            @org.springframework.data.repository.query.Param("actorId") Long actorId,
            @org.springframework.data.repository.query.Param("action") org.example.backend.enums.LogAction action,
            org.springframework.data.domain.Pageable pageable);
}
