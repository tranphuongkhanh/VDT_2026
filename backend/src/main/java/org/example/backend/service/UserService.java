package org.example.backend.service;

import org.example.backend.dto.request.CreateUserRequest;
import org.example.backend.dto.request.RoleAssignmentRequest;
import org.example.backend.dto.request.UpdateProfileRequest;
import org.example.backend.dto.request.UpdateUserRequest;
import org.example.backend.dto.response.UserResponse;
import org.example.backend.entity.Department;
import org.example.backend.entity.Role;
import org.example.backend.entity.User;
import org.example.backend.entity.UserRole;
import org.example.backend.entity.UserRoleId;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.DepartmentRepository;
import org.example.backend.repository.RoleRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.UserRoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String search, Long departmentId, Boolean isActive, Pageable pageable) {
        String searchParam = null;
        if (search != null && !search.trim().isEmpty()) {
            searchParam = "%" + search.trim().toLowerCase() + "%";
        }
        Page<User> usersPage = userRepository.findUsersWithFilters(searchParam, departmentId, isActive, pageable);
        return usersPage.map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return convertToResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return convertToResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email '" + request.getEmail() + "' is already in use");
        }
        if (request.getEmployeeCode() != null && !request.getEmployeeCode().isBlank() &&
                userRepository.findByEmployeeCode(request.getEmployeeCode()).isPresent()) {
            throw new BadRequestException("Employee code '" + request.getEmployeeCode() + "' is already taken");
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .department(department)
                .manager(manager)
                .employeeCode(request.getEmployeeCode())
                .position(request.getPosition())
                .avatarUrl(request.getAvatarUrl())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        return convertToResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Email uniqueness validation if changed
        if (!user.getEmail().equalsIgnoreCase(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new BadRequestException("Email '" + request.getEmail() + "' is already in use");
            }
            user.setEmail(request.getEmail());
        }

        // Employee code uniqueness validation if changed
        if (request.getEmployeeCode() != null && !request.getEmployeeCode().isBlank() &&
                !request.getEmployeeCode().equalsIgnoreCase(user.getEmployeeCode())) {
            if (userRepository.findByEmployeeCode(request.getEmployeeCode()).isPresent()) {
                throw new BadRequestException("Employee code '" + request.getEmployeeCode() + "' is already taken");
            }
            user.setEmployeeCode(request.getEmployeeCode());
        } else if (request.getEmployeeCode() == null || request.getEmployeeCode().isBlank()) {
            user.setEmployeeCode(null);
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

        User manager = null;
        if (request.getManagerId() != null) {
            if (request.getManagerId().equals(id)) {
                throw new BadRequestException("A user cannot be their own manager");
            }
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        }

        user.setFullName(request.getFullName());
        user.setDepartment(department);
        user.setManager(manager);
        user.setPosition(request.getPosition());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return convertToResponse(saved);
    }

    @Transactional
    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        user.setFullName(request.getFullName());
        user.setPosition(request.getPosition());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return convertToResponse(saved);
    }

    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void assignRole(Long userId, RoleAssignmentRequest request, String currentUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + request.getRoleId()));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current logged-in user details not found"));

        UserRoleId userRoleId = new UserRoleId(userId, role.getId());
        if (userRoleRepository.existsById(userRoleId)) {
            throw new BadRequestException("Role '" + role.getCode() + "' is already assigned to the user");
        }

        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .grantedBy(currentUser)
                .grantedAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .build();

        userRoleRepository.save(userRole);
    }

    @Transactional
    public void removeRole(Long userId, Long roleId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        if (!roleRepository.existsById(roleId)) {
            throw new ResourceNotFoundException("Role not found with id: " + roleId);
        }

        UserRoleId userRoleId = new UserRoleId(userId, roleId);
        if (!userRoleRepository.existsById(userRoleId)) {
            throw new ResourceNotFoundException("Role assignment not found for this user");
        }

        userRoleRepository.deleteById(userRoleId);
    }

    private UserResponse convertToResponse(User user) {
        UserResponse.DepartmentInfo deptInfo = null;
        if (user.getDepartment() != null) {
            deptInfo = UserResponse.DepartmentInfo.builder()
                    .id(user.getDepartment().getId())
                    .code(user.getDepartment().getCode())
                    .name(user.getDepartment().getName())
                    .build();
        }

        UserResponse.ManagerInfo managerInfo = null;
        if (user.getManager() != null) {
            managerInfo = UserResponse.ManagerInfo.builder()
                    .id(user.getManager().getId())
                    .fullName(user.getManager().getFullName())
                    .username(user.getManager().getUsername())
                    .build();
        }

        List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                .map(ur -> ur.getRole().getCode())
                .toList();

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .department(deptInfo)
                .manager(managerInfo)
                .employeeCode(user.getEmployeeCode())
                .position(user.getPosition())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
