package org.example.backend.repository;

import jakarta.persistence.LockModeType;
import org.example.backend.entity.Request;
import org.example.backend.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    Optional<Request> findByRequestNo(String requestNo);

    /**
     * Pessimistic Write Lock — dùng cho mọi thao tác thay đổi trạng thái.
     * Phát lệnh SELECT ... FOR UPDATE, buộc các transaction khác phải chờ.
     * Ngăn chặn race condition khi approve/reject/return/submit đồng thời.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Request r WHERE r.id = :id")
    Optional<Request> findByIdWithLock(@Param("id") Long id);

    // Lấy danh sách yêu cầu của một user (phân trang, filter theo status)
    @Query("SELECT r FROM Request r WHERE r.requester.id = :requesterId " +
           "AND (:status IS NULL OR r.status = :status) " +
           "ORDER BY r.createdAt DESC")
    Page<Request> findByRequesterIdWithFilter(
            @Param("requesterId") Long requesterId,
            @Param("status") RequestStatus status,
            Pageable pageable);

    // Lấy tất cả yêu cầu đang IN_REVIEW
    List<Request> findByStatus(RequestStatus status);

    /**
     * Đếm + Lock dùng để sinh requestNo an toàn.
     * Lock ở cấp độ rows → ngăn hai transaction cùng đọc count và sinh trùng số.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Request r WHERE r.requestType.id = :requestTypeId " +
           "AND YEAR(r.createdAt) = :year ORDER BY r.id DESC")
    List<Request> findByRequestTypeAndYearWithLock(
            @Param("requestTypeId") Long requestTypeId,
            @Param("year") int year);

    // Đếm số yêu cầu theo request type và năm (dùng để sinh requestNo)
    @Query("SELECT COUNT(r) FROM Request r WHERE r.requestType.id = :requestTypeId " +
           "AND YEAR(r.createdAt) = :year")
    long countByRequestTypeIdAndYear(
            @Param("requestTypeId") Long requestTypeId,
            @Param("year") int year);

    // Admin: lấy tất cả yêu cầu với filter
    @Query("SELECT r FROM Request r WHERE " +
           "(:status IS NULL OR r.status = :status) " +
           "AND (:requestTypeId IS NULL OR r.requestType.id = :requestTypeId) " +
           "AND (:requesterId IS NULL OR r.requester.id = :requesterId) " +
           "AND (:departmentId IS NULL OR r.requester.department.id = :departmentId) " +
           "AND (:fromDate IS NULL OR r.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR r.createdAt <= :toDate) " +
           "ORDER BY r.createdAt DESC")
    Page<Request> findAllWithFilters(
            @Param("status") RequestStatus status,
            @Param("requestTypeId") Long requestTypeId,
            @Param("requesterId") Long requesterId,
            @Param("departmentId") Long departmentId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    // Dashboard: Count total requests by a user
    long countByRequesterId(Long requesterId);

    // Dashboard: Count requests by user and status
    long countByRequesterIdAndStatus(Long requesterId, RequestStatus status);

    // Dashboard: Count requests by status
    @Query("SELECT r.status, COUNT(r) FROM Request r GROUP BY r.status")
    List<Object[]> countRequestsByStatus();

    // Dashboard: Count requests by type
    @Query("SELECT r.requestType.name, COUNT(r) FROM Request r GROUP BY r.requestType.name")
    List<Object[]> countRequestsByType();

    // Dashboard: Count requests by department
    @Query("SELECT COALESCE(d.name, 'No Department'), COUNT(r) FROM Request r LEFT JOIN r.requester.department d GROUP BY d.name")
    List<Object[]> countRequestsByDepartment();
}
