package org.example.backend.controller;

import org.example.backend.dto.request.CreateWorkflowRequest;
import org.example.backend.dto.request.CreateWorkflowStepRequest;
import org.example.backend.dto.request.ReorderStepsRequest;
import org.example.backend.dto.request.UpdateWorkflowRequest;
import org.example.backend.dto.request.UpdateWorkflowStepRequest;
import org.example.backend.dto.response.WorkflowResponse;
import org.example.backend.dto.response.WorkflowStepResponse;
import org.example.backend.service.WorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WorkflowResponse>> getAllWorkflows() {
        return ResponseEntity.ok(workflowService.getAllWorkflows());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkflowResponse> createWorkflow(
            @Valid @RequestBody CreateWorkflowRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.createWorkflow(request, userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkflowResponse> getWorkflowById(@PathVariable Long id) {
        return ResponseEntity.ok(workflowService.getWorkflowById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkflowResponse> updateWorkflow(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkflowRequest request) {
        return ResponseEntity.ok(workflowService.updateWorkflow(id, request));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkflowResponse> activateWorkflow(@PathVariable Long id) {
        return ResponseEntity.ok(workflowService.activateWorkflow(id));
    }

    @GetMapping("/{id}/steps")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WorkflowStepResponse>> getWorkflowSteps(@PathVariable Long id) {
        return ResponseEntity.ok(workflowService.getWorkflowSteps(id));
    }

    @PostMapping("/{id}/steps")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkflowStepResponse> addWorkflowStep(
            @PathVariable Long id,
            @Valid @RequestBody CreateWorkflowStepRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.addWorkflowStep(id, request));
    }

    @PutMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkflowStepResponse> updateWorkflowStep(
            @PathVariable Long id,
            @PathVariable Long stepId,
            @Valid @RequestBody UpdateWorkflowStepRequest request) {
        return ResponseEntity.ok(workflowService.updateWorkflowStep(id, stepId, request));
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWorkflowStep(
            @PathVariable Long id,
            @PathVariable Long stepId) {
        workflowService.deleteWorkflowStep(id, stepId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/steps/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reorderSteps(
            @PathVariable Long id,
            @Valid @RequestBody ReorderStepsRequest request) {
        workflowService.reorderSteps(id, request);
        return ResponseEntity.noContent().build();
    }
}
