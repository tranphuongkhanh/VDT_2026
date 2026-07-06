package org.example.backend.repository;

import org.example.backend.entity.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestTypeRepository extends JpaRepository<RequestType, Long> {
    Optional<RequestType> findByCode(String code);
    List<RequestType> findByIsActiveTrueOrderBySortOrderAsc();
    List<RequestType> findAllByOrderBySortOrderAsc();

    @Query("SELECT r FROM RequestType r WHERE " +
           "(:search IS NULL OR LOWER(r.code) LIKE :search " +
           "OR LOWER(r.name) LIKE :search " +
           "OR LOWER(r.description) LIKE :search) " +
           "AND (:categoryId IS NULL OR r.category.id = :categoryId) " +
           "AND (:isActive IS NULL OR r.isActive = :isActive) " +
           "ORDER BY r.sortOrder ASC, r.id ASC")
    Page<RequestType> findRequestTypesWithFilters(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}
