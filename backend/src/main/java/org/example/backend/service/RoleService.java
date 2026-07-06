package org.example.backend.service;

import org.example.backend.dto.request.CreateRoleRequest;
import org.example.backend.dto.request.UpdateRoleRequest;
import org.example.backend.dto.response.RoleResponse;
import org.example.backend.entity.Role;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("Role code '" + request.getCode() + "' already exists");
        }

        Role role = Role.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .isSystem(false)
                .createdAt(LocalDateTime.now())
                .build();

        Role saved = roleRepository.save(role);
        return convertToResponse(saved);
    }

    @Transactional
    public RoleResponse updateRole(Long id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        Role saved = roleRepository.save(role);
        return convertToResponse(saved);
    }

    private RoleResponse convertToResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .isSystem(role.getIsSystem())
                .createdAt(role.getCreatedAt())
                .build();
    }
}
