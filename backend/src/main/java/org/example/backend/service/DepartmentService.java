package org.example.backend.service;

import org.example.backend.dto.request.CreateDepartmentRequest;
import org.example.backend.dto.request.UpdateDepartmentRequest;
import org.example.backend.dto.response.DepartmentResponse;
import org.example.backend.entity.Department;
import org.example.backend.entity.User;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.DepartmentRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public DepartmentService(DepartmentRepository departmentRepository, UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartmentTree() {
        List<Department> allDepts = departmentRepository.findByIsActiveTrue();

        // Convert to DTOs
        List<DepartmentResponse> dtos = allDepts.stream()
                .map(this::convertToResponse)
                .toList();

        // Map parent-child associations
        Map<Long, List<DepartmentResponse>> childrenMap = dtos.stream()
                .filter(d -> d.getParentId() != null)
                .collect(Collectors.groupingBy(DepartmentResponse::getParentId));

        // Find roots (no parent or parent is not active/present in this list)
        Set<Long> deptIds = dtos.stream().map(DepartmentResponse::getId).collect(Collectors.toSet());
        List<DepartmentResponse> roots = dtos.stream()
                .filter(d -> d.getParentId() == null || !deptIds.contains(d.getParentId()))
                .toList();

        // Recursively build tree
        roots.forEach(root -> assembleTree(root, childrenMap));

        // Sort roots by code or name
        return roots.stream()
                .sorted(Comparator.comparing(DepartmentResponse::getCode))
                .toList();
    }

    private void assembleTree(DepartmentResponse node, Map<Long, List<DepartmentResponse>> childrenMap) {
        List<DepartmentResponse> children = childrenMap.getOrDefault(node.getId(), new ArrayList<>());
        children.sort(Comparator.comparing(DepartmentResponse::getCode));
        node.setChildren(children);
        children.forEach(child -> assembleTree(child, childrenMap));
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        if (departmentRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("Department code '" + request.getCode() + "' already exists");
        }

        Department parent = null;
        if (request.getParentId() != null) {
            parent = departmentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent department not found"));
            if (!Boolean.TRUE.equals(parent.getIsActive())) {
                throw new BadRequestException("Parent department is inactive");
            }
        }

        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        }

        Department dept = Department.builder()
                .code(request.getCode())
                .name(request.getName())
                .parent(parent)
                .manager(manager)
                .level(parent == null ? 0 : parent.getLevel() + 1)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Department saved = departmentRepository.save(dept);
        String path = parent == null ? "/" + saved.getId() : parent.getPath() + "/" + saved.getId();
        saved.setPath(path);
        saved = departmentRepository.save(saved);

        return convertToResponse(saved);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        }

        Department oldParent = dept.getParent();
        Department newParent = null;
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("A department cannot be its own parent");
            }
            newParent = departmentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent department not found"));

            // Check circular dependency
            if (newParent.getPath() != null && dept.getPath() != null &&
                (newParent.getPath().equals(dept.getPath()) || newParent.getPath().startsWith(dept.getPath() + "/"))) {
                throw new BadRequestException("Circular hierarchy detected: parent department cannot be a child of this department");
            }
        }

        dept.setName(request.getName());
        dept.setManager(manager);
        if (request.getIsActive() != null) {
            dept.setIsActive(request.getIsActive());
        }

        boolean parentChanged = !Objects.equals(oldParent == null ? null : oldParent.getId(), request.getParentId());
        if (parentChanged) {
            dept.setParent(newParent);
            dept.setLevel(newParent == null ? 0 : newParent.getLevel() + 1);
            String oldPath = dept.getPath();
            String newPath = newParent == null ? "/" + dept.getId() : newParent.getPath() + "/" + dept.getId();
            dept.setPath(newPath);

            // Update children path and level recursively
            updateChildrenHierarchy(dept, oldPath, newPath);
        }

        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);

        return convertToResponse(saved);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        // Soft delete department
        dept.setIsActive(false);
        dept.setUpdatedAt(LocalDateTime.now());
        departmentRepository.save(dept);

        // Soft delete all descendants as well
        List<Department> allDepts = departmentRepository.findAll();
        String prefix = dept.getPath() + "/";
        for (Department d : allDepts) {
            if (d.getPath() != null && d.getPath().startsWith(prefix)) {
                d.setIsActive(false);
                d.setUpdatedAt(LocalDateTime.now());
                departmentRepository.save(d);
            }
        }
    }

    private void updateChildrenHierarchy(Department parent, String oldParentPath, String newParentPath) {
        List<Department> allDepts = departmentRepository.findAll();
        for (Department d : allDepts) {
            if (d.getPath() != null && d.getPath().startsWith(oldParentPath + "/")) {
                String subPath = d.getPath().substring(oldParentPath.length());
                d.setPath(newParentPath + subPath);
                // Level difference
                int levelDiff = parent.getLevel() - (d.getLevel() - subPath.split("/").length + 1);
                d.setLevel(d.getLevel() + levelDiff);
                d.setUpdatedAt(LocalDateTime.now());
                departmentRepository.save(d);
            }
        }
    }

    private DepartmentResponse convertToResponse(Department d) {
        DepartmentResponse.ManagerInfo managerInfo = null;
        if (d.getManager() != null) {
            managerInfo = DepartmentResponse.ManagerInfo.builder()
                    .id(d.getManager().getId())
                    .fullName(d.getManager().getFullName())
                    .build();
        }

        return DepartmentResponse.builder()
                .id(d.getId())
                .code(d.getCode())
                .name(d.getName())
                .parentId(d.getParent() == null ? null : d.getParent().getId())
                .level(d.getLevel())
                .path(d.getPath())
                .manager(managerInfo)
                .isActive(d.getIsActive())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
