package org.example.backend.repository;

import org.example.backend.entity.Delegation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DelegationRepository extends JpaRepository<Delegation, Long> {
    List<Delegation> findByDelegatorIdAndIsActiveTrue(Long delegatorId);
    List<Delegation> findByDelegateToIdAndIsActiveTrue(Long delegateToId);
    List<Delegation> findByIsActiveTrueAndFromDateLessThanEqualAndToDateGreaterThanEqual(LocalDate fromDate, LocalDate toDate);
}
