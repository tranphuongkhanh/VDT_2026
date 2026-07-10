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
           "(:requestNo IS NULL OR :requestNo = '' OR " +
           "     LOWER(l.request.requestNo) LIKE LOWER(CONCAT('%', :requestNo, '%'))) " +
           "AND (:actorName IS NULL OR :actorName = '' OR " +
           "     LOWER(l.actor.fullName) LIKE LOWER(CONCAT('%', :actorName, '%')) OR " +
           "     LOWER(l.actor.username) LIKE LOWER(CONCAT('%', :actorName, '%'))) " +
           "AND (:action IS NULL OR l.action = :action) " +
           "ORDER BY l.createdAt DESC")
    org.springframework.data.domain.Page<RequestLog> findAllWithFilters(
            @org.springframework.data.repository.query.Param("requestNo") String requestNo,
            @org.springframework.data.repository.query.Param("actorName") String actorName,
            @org.springframework.data.repository.query.Param("action") org.example.backend.enums.LogAction action,
            org.springframework.data.domain.Pageable pageable);
}
