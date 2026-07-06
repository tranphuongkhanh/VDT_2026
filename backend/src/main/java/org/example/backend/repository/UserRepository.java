package org.example.backend.repository;

import org.example.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeCode(String employeeCode);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.username) LIKE :search " +
           "OR LOWER(u.email) LIKE :search " +
           "OR LOWER(u.fullName) LIKE :search " +
           "OR LOWER(u.employeeCode) LIKE :search) " +
           "AND (:departmentId IS NULL OR u.department.id = :departmentId) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> findUsersWithFilters(
            @Param("search") String search,
            @Param("departmentId") Long departmentId,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}
