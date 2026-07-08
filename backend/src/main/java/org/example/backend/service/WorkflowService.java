package org.example.backend.service;

import org.example.backend.dto.request.CreateWorkflowRequest;
import org.example.backend.dto.request.CreateWorkflowStepRequest;
import org.example.backend.dto.request.ReorderStepsRequest;
import org.example.backend.exception.BadRequestException;
import org.example.backend.dto.request.UpdateWorkflowRequest;
import org.example.backend.dto.request.UpdateWorkflowStepRequest;
import org.example.backend.dto.response.WorkflowResponse;
import org.example.backend.dto.response.WorkflowStepResponse;
import org.example.backend.entity.RequestType;
import org.example.backend.entity.User;
import org.example.backend.entity.Workflow;
import org.example.backend.entity.WorkflowStep;
import org.example.backend.enums.ApproverType;
import org.example.backend.enums.RoleApprovalMode;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.DepartmentRepository;
import org.example.backend.repository.RequestTypeRepository;
import org.example.backend.repository.RoleRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.WorkflowRepository;
import org.example.backend.repository.WorkflowStepRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;

    public WorkflowService(
            WorkflowRepository workflowRepository,
            WorkflowStepRepository workflowStepRepository,
            RequestTypeRepository requestTypeRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository) {
        this.workflowRepository = workflowRepository;
        this.workflowStepRepository = workflowStepRepository;
        this.requestTypeRepository = requestTypeRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkflowResponse> getAllWorkflows() {
        return workflowRepository.findAll().stream()
                .map(this::convertToWorkflowResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflowById(Long id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
        return convertToWorkflowResponse(workflow);
    }

    @Transactional
    public WorkflowResponse createWorkflow(CreateWorkflowRequest request, String username) {
        RequestType requestType = requestTypeRepository.findById(request.getRequestTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Request type not found with id: " + request.getRequestTypeId()));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        List<Workflow> existingWorkflows = workflowRepository.findByRequestTypeId(request.getRequestTypeId());
        int nextVersion = existingWorkflows.stream()
                .mapToInt(Workflow::getVersion)
                .max()
                .orElse(0) + 1;

        Workflow workflow = Workflow.builder()
                .requestType(requestType)
                .name(request.getName().trim())
                .description(request.getDescription())
                .version(nextVersion)
                .isActive(false) // New workflow versions are inactive by default
                .createdBy(currentUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Workflow saved = workflowRepository.save(workflow);
        return convertToWorkflowResponse(saved);
    }

    @Transactional
    public WorkflowResponse updateWorkflow(Long id, UpdateWorkflowRequest request) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        workflow.setName(request.getName().trim());
        workflow.setDescription(request.getDescription());
        workflow.setUpdatedAt(LocalDateTime.now());

        Workflow saved = workflowRepository.save(workflow);
        return convertToWorkflowResponse(saved);
    }

    @Transactional
    public WorkflowResponse activateWorkflow(Long id) {
        Workflow targetWorkflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        if (targetWorkflow.getIsActive()) {
            return convertToWorkflowResponse(targetWorkflow);
        }

        // Deactivate currently active workflow(s) for the same request type
        Long requestTypeId = targetWorkflow.getRequestType().getId();
        workflowRepository.findByRequestTypeIdAndIsActiveTrue(requestTypeId)
                .ifPresent(activeWorkflow -> {
                    activeWorkflow.setIsActive(false);
                    activeWorkflow.setUpdatedAt(LocalDateTime.now());
                    workflowRepository.saveAndFlush(activeWorkflow);
                });

        targetWorkflow.setIsActive(true);
        targetWorkflow.setUpdatedAt(LocalDateTime.now());
        Workflow saved = workflowRepository.save(targetWorkflow);
        return convertToWorkflowResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkflowStepResponse> getWorkflowSteps(Long workflowId) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new ResourceNotFoundException("Workflow not found with id: " + workflowId);
        }
        return workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId).stream()
                .map(this::convertToWorkflowStepResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkflowStepResponse addWorkflowStep(Long workflowId, CreateWorkflowStepRequest request) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + workflowId));

        RoleApprovalMode mode = request.getRoleApprovalMode();
        Integer threshold = request.getRoleApprovalThreshold();

        if (request.getApproverType() != ApproverType.ROLE) {
            mode = null;
            threshold = null;
        } else if (mode != RoleApprovalMode.THRESHOLD) {
            threshold = null;
        }

        validateApproverSettings(request.getApproverType(), request.getApproverRefId(), mode, threshold);

        List<WorkflowStep> existingSteps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        int nextOrder = existingSteps.stream()
                .mapToInt(WorkflowStep::getStepOrder)
                .max()
                .orElse(0) + 1;

        WorkflowStep step = WorkflowStep.builder()
                .workflow(workflow)
                .stepOrder(nextOrder)
                .name(request.getName().trim())
                .approverType(request.getApproverType())
                .approverRefId(request.getApproverRefId())
                .actionOnApprove(request.getActionOnApprove())
                .roleApprovalMode(mode)
                .roleApprovalThreshold(threshold)
                .timeLimitHours(request.getTimeLimitHours())
                .notifyOnEnter(request.getNotifyOnEnter())
                .description(request.getDescription())
                .build();

        WorkflowStep saved = workflowStepRepository.save(step);
        return convertToWorkflowStepResponse(saved);
    }

    @Transactional
    public WorkflowStepResponse updateWorkflowStep(Long workflowId, Long stepId, UpdateWorkflowStepRequest request) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new ResourceNotFoundException("Workflow not found with id: " + workflowId);
        }

        WorkflowStep step = workflowStepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow step not found with id: " + stepId));

        if (!step.getWorkflow().getId().equals(workflowId)) {
            throw new IllegalArgumentException("Step does not belong to the specified workflow");
        }

        step.setName(request.getName().trim());
        step.setApproverType(request.getApproverType());
        step.setApproverRefId(request.getApproverRefId());
        step.setActionOnApprove(request.getActionOnApprove());

        RoleApprovalMode newMode = request.getRoleApprovalMode() != null ? request.getRoleApprovalMode()
                : step.getRoleApprovalMode();
        Integer newThreshold = request.getRoleApprovalThreshold() != null ? request.getRoleApprovalThreshold()
                : step.getRoleApprovalThreshold();

        if (request.getApproverType() != ApproverType.ROLE) {
            newMode = null;
            newThreshold = null;
        } else if (newMode != RoleApprovalMode.THRESHOLD) {
            newThreshold = null;
        }

        step.setRoleApprovalMode(newMode);
        step.setRoleApprovalThreshold(newThreshold);

        validateApproverSettings(step.getApproverType(), step.getApproverRefId(), step.getRoleApprovalMode(),
                step.getRoleApprovalThreshold());

        if (request.getTimeLimitHours() != null) {
            step.setTimeLimitHours(request.getTimeLimitHours());
        }
        if (request.getNotifyOnEnter() != null) {
            step.setNotifyOnEnter(request.getNotifyOnEnter());
        }
        step.setDescription(request.getDescription());

        WorkflowStep saved = workflowStepRepository.save(step);
        return convertToWorkflowStepResponse(saved);
    }

    @Transactional
    public void deleteWorkflowStep(Long workflowId, Long stepId) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new ResourceNotFoundException("Workflow not found with id: " + workflowId);
        }

        WorkflowStep step = workflowStepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow step not found with id: " + stepId));

        if (!step.getWorkflow().getId().equals(workflowId)) {
            throw new IllegalArgumentException("Step does not belong to the specified workflow");
        }

        workflowStepRepository.delete(step);

        // Reorder remaining steps
        List<WorkflowStep> remainingSteps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        for (int i = 0; i < remainingSteps.size(); i++) {
            WorkflowStep remainingStep = remainingSteps.get(i);
            remainingStep.setStepOrder(i + 1);
            workflowStepRepository.save(remainingStep);
        }
    }

    @Transactional
    public void reorderSteps(Long workflowId, ReorderStepsRequest request) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new ResourceNotFoundException("Workflow not found with id: " + workflowId);
        }

        List<WorkflowStep> existingSteps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        List<Long> requestedOrder = request.getStepIds();

        if (existingSteps.size() != requestedOrder.size()) {
            throw new IllegalArgumentException("Mismatch in number of steps");
        }

        for (int i = 0; i < requestedOrder.size(); i++) {
            Long stepId = requestedOrder.get(i);
            WorkflowStep stepToUpdate = existingSteps.stream()
                    .filter(s -> s.getId().equals(stepId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Step with id " + stepId + " not found in this workflow"));

            stepToUpdate.setStepOrder(i + 1);
            workflowStepRepository.save(stepToUpdate);
        }
    }

    private WorkflowResponse convertToWorkflowResponse(Workflow workflow) {
        return WorkflowResponse.builder()
                .id(workflow.getId())
                .requestTypeId(workflow.getRequestType().getId())
                .requestTypeName(workflow.getRequestType().getName())
                .name(workflow.getName())
                .version(workflow.getVersion())
                .description(workflow.getDescription())
                .isActive(workflow.getIsActive())
                .createdByUsername(workflow.getCreatedBy() != null ? workflow.getCreatedBy().getUsername() : null)
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .build();
    }

    private WorkflowStepResponse convertToWorkflowStepResponse(WorkflowStep step) {
        return WorkflowStepResponse.builder()
                .id(step.getId())
                .workflowId(step.getWorkflow().getId())
                .stepOrder(step.getStepOrder())
                .name(step.getName())
                .approverType(step.getApproverType())
                .approverRefId(step.getApproverRefId())
                .actionOnApprove(step.getActionOnApprove())
                .roleApprovalMode(step.getRoleApprovalMode())
                .roleApprovalThreshold(step.getRoleApprovalThreshold())
                .timeLimitHours(step.getTimeLimitHours())
                .notifyOnEnter(step.getNotifyOnEnter())
                .description(step.getDescription())
                .build();
    }

    private void validateApproverSettings(ApproverType approverType, Long approverRefId,
            RoleApprovalMode roleApprovalMode, Integer roleApprovalThreshold) {
        if (approverType == null) {
            throw new BadRequestException("Approver type cannot be null");
        }

        switch (approverType) {
            case USER:
                if (approverRefId == null) {
                    throw new BadRequestException("Approver Reference ID is required for USER approver type");
                }
                if (!userRepository.existsById(approverRefId)) {
                    throw new ResourceNotFoundException("User not found with id: " + approverRefId);
                }
                break;
            case ROLE:
                if (approverRefId == null) {
                    throw new BadRequestException("Approver Reference ID is required for ROLE approver type");
                }
                if (!roleRepository.existsById(approverRefId)) {
                    throw new ResourceNotFoundException("Role not found with id: " + approverRefId);
                }
                if (roleApprovalMode == null) {
                    throw new BadRequestException("Role approval mode is required for ROLE approver type");
                }
                if (roleApprovalMode == RoleApprovalMode.THRESHOLD) {
                    if (roleApprovalThreshold == null || roleApprovalThreshold <= 0) {
                        throw new BadRequestException(
                                "Valid role approval threshold (>0) is required for THRESHOLD mode");
                    }
                } else {
                    if (roleApprovalThreshold != null) {
                        throw new BadRequestException(
                                "Role approval threshold should be null for " + roleApprovalMode + " mode");
                    }
                }
                break;
            case SPECIFIC_DEPARTMENT_HEAD:
                if (approverRefId == null) {
                    throw new BadRequestException(
                            "Approver Reference ID is required for SPECIFIC_DEPARTMENT_HEAD approver type");
                }
                if (!departmentRepository.existsById(approverRefId)) {
                    throw new ResourceNotFoundException("Department not found with id: " + approverRefId);
                }
                break;
            case DEPARTMENT_HEAD:
            case DIRECT_MANAGER:
                if (approverRefId != null) {
                    throw new BadRequestException(
                            "Approver Reference ID should be null for " + approverType + " approver type");
                }
                break;
            default:
                throw new BadRequestException("Unsupported approver type: " + approverType);
        }

        if (approverType != ApproverType.ROLE) {
            if (roleApprovalMode != null) {
                throw new BadRequestException("Role approval mode should be null for non-ROLE approver type");
            }
            if (roleApprovalThreshold != null) {
                throw new BadRequestException("Role approval threshold should be null for non-ROLE approver type");
            }
        }
    }
}
