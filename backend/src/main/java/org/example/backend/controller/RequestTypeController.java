package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.dto.request.CreateFormRequest;
import org.example.backend.dto.request.CreateRequestTypeRequest;
import org.example.backend.dto.request.UpdateRequestTypeRequest;
import org.example.backend.dto.response.FormResponse;
import org.example.backend.dto.response.RequestTypeResponse;
import org.example.backend.service.FormService;
import org.example.backend.service.RequestTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/request-types")
public class RequestTypeController {

    private final RequestTypeService requestTypeService;
    private final FormService formService;

    public RequestTypeController(RequestTypeService requestTypeService, FormService formService) {
        this.requestTypeService = requestTypeService;
        this.formService = formService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<RequestTypeResponse>> getRequestTypes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Boolean finalIsActive = isActive;
        if (!isAdmin) {
            finalIsActive = true;
        }

        Page<RequestTypeResponse> requestTypes = requestTypeService.getRequestTypes(search, categoryId, finalIsActive,
                pageable);
        return ResponseEntity.ok(requestTypes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RequestTypeResponse> getRequestType(@PathVariable Long id) {
        RequestTypeResponse requestType = requestTypeService.getRequestTypeById(id);
        return ResponseEntity.ok(requestType);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RequestTypeResponse> createRequestType(
            @Valid @RequestBody CreateRequestTypeRequest request) {
        RequestTypeResponse created = requestTypeService.createRequestType(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RequestTypeResponse> updateRequestType(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRequestTypeRequest request) {
        RequestTypeResponse updated = requestTypeService.updateRequestType(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateRequestType(@PathVariable Long id) {
        requestTypeService.deactivateRequestType(id);
        return ResponseEntity.ok(Map.of("message", "Request type deactivated successfully"));
    }

    @GetMapping("/{id}/form")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FormResponse> getActiveForm(@PathVariable Long id) {
        FormResponse activeForm = formService.getActiveFormByRequestTypeId(id);
        return ResponseEntity.ok(activeForm);
    }

    @PostMapping("/{id}/forms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FormResponse> createForm(
            @PathVariable Long id,
            @Valid @RequestBody CreateFormRequest request,
            Principal principal) {
        FormResponse createdForm = formService.createForm(id, request, principal.getName());
        return ResponseEntity.ok(createdForm);
    }
}
