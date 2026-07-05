package org.example.backend.repository;

import org.example.backend.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
    Optional<Request> findByRequestNo(String requestNo);
    List<Request> findByRequesterId(Long requesterId);
    List<Request> findByStatus(String status);
}
