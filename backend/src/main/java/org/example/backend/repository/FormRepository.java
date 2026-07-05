package org.example.backend.repository;

import org.example.backend.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FormRepository extends JpaRepository<Form, Long> {
    List<Form> findByRequestTypeId(Long requestTypeId);
    Optional<Form> findByRequestTypeIdAndIsActiveTrue(Long requestTypeId);
}
