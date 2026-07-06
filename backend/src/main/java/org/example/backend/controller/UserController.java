package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.dto.request.CreateUserRequest;
import org.example.backend.dto.request.RoleAssignmentRequest;
import org.example.backend.dto.request.UpdateProfileRequest;
import org.example.backend.dto.request.UpdateUserRequest;
import org.example.backend.dto.response.UserResponse;
import org.example.backend.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> users = userService.getUsers(search, departmentId, isActive, pageable);
        return ResponseEntity.ok(users);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.createUser(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getMyProfile(Principal principal) {
        UserResponse me = userService.getUserByUsername(principal.getName());
        return ResponseEntity.ok(me);
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateMyProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse updated = userService.updateUser(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleAssignmentRequest request,
            Principal principal) {
        userService.assignRole(id, request, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Role assigned successfully"));
    }

    @DeleteMapping("/{id}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeRole(
            @PathVariable Long id,
            @PathVariable Long roleId) {
        userService.removeRole(id, roleId);
        return ResponseEntity.ok(Map.of("message", "Role removed successfully"));
    }
}
