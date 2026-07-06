package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.dto.request.CreateDepartmentRequest;
import org.example.backend.dto.request.UpdateDepartmentRequest;
import org.example.backend.dto.response.DepartmentResponse;
import org.example.backend.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DepartmentResponse>> getDepartmentTree() {
        List<DepartmentResponse> tree = departmentService.getDepartmentTree();
        return ResponseEntity.ok(tree);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponse> createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        DepartmentResponse created = departmentService.createDepartment(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDepartmentRequest request) {
        DepartmentResponse updated = departmentService.updateDepartment(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully (soft delete)"));
    }
}
