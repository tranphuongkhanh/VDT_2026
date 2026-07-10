package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.request.ApprovalActionRequest;
import org.example.backend.dto.request.CreateRequestRequest;
import org.example.backend.dto.request.SubmitRequestRequest;
import org.example.backend.dto.request.UpdateRequestRequest;
import org.example.backend.dto.response.PendingApprovalResponse;
import org.example.backend.dto.response.RequestApprovalResponse;
import org.example.backend.dto.response.RequestLogResponse;
import org.example.backend.dto.response.RequestResponse;
import org.example.backend.entity.*;
import org.example.backend.enums.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.UserRoleRepository;
import org.example.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepository;
    private final RequestApprovalRepository requestApprovalRepository;
    private final RequestLogRepository requestLogRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final FormRepository formRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final ApproverResolverService approverResolverService;
    private final NotificationService notificationService;

    // =========================================================================
    // CREATE / UPDATE / DELETE
    // =========================================================================

    @Transactional
    public RequestResponse createRequest(CreateRequestRequest req, String username) {
        User requester = findUserByUsername(username);

        RequestType requestType = requestTypeRepository.findById(req.getRequestTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Request type not found: " + req.getRequestTypeId()));

        if (!Boolean.TRUE.equals(requestType.getIsActive())) {
            throw new BadRequestException("Request type is not active");
        }

        // Lấy workflow active cho request type này
        Workflow workflow = workflowRepository
                .findByRequestTypeIdAndIsActiveTrue(req.getRequestTypeId())
                .orElseThrow(() -> new BadRequestException(
                        "No active workflow found for request type: " + req.getRequestTypeId()));

        // Lấy form active
        Form form = formRepository
                .findByRequestTypeIdAndIsActiveTrue(req.getRequestTypeId())
                .orElseThrow(() -> new BadRequestException(
                        "No active form found for request type: " + req.getRequestTypeId()));

        // Sinh requestNo: {TYPE_CODE}-{YEAR}-{SEQ:5d}
        String requestNo = generateRequestNo(requestType);

        Request request = Request.builder()
                .requestNo(requestNo)
                .requestType(requestType)
                .requester(requester)
                .workflow(workflow)
                .form(form)
                .currentStep(0)
                .status(RequestStatus.DRAFT)
                .formData(req.getFormData())
                .title(req.getTitle().trim())
                .priority(req.getPriority() != null ? req.getPriority() : RequestPriority.NORMAL)
                .note(req.getNote())
                .dueDate(req.getDueDate())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Request saved = requestRepository.save(request);

        // Ghi log
        saveLog(saved, requester, LogAction.CREATED, null, RequestStatus.DRAFT, null, 0);

        return toResponse(saved);
    }

    @Transactional
    public RequestResponse updateRequest(Long id, UpdateRequestRequest req, String username) {
        // Dùng lock để tránh concurrent update
        Request request = findRequestByIdForUpdate(id);
        User currentUser = findUserByUsername(username);

        // Chỉ owner được cập nhật
        if (!request.getRequester().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You are not the owner of this request");
        }

        // Chỉ cập nhật được khi DRAFT hoặc RETURNED
        if (request.getStatus() != RequestStatus.DRAFT && request.getStatus() != RequestStatus.RETURNED) {
            throw new BadRequestException("Can only update request in DRAFT or RETURNED status");
        }

        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            request.setTitle(req.getTitle().trim());
        }
        if (req.getFormData() != null) {
            request.setFormData(req.getFormData());
        }
        if (req.getNote() != null) {
            request.setNote(req.getNote());
        }
        if (req.getDueDate() != null) {
            request.setDueDate(req.getDueDate());
        }
        if (req.getPriority() != null) {
            request.setPriority(req.getPriority());
        }
        request.setUpdatedAt(LocalDateTime.now());

        Request saved = requestRepository.save(request);
        saveLog(saved, currentUser, LogAction.UPDATED, request.getStatus(), request.getStatus(), null, null);

        return toResponse(saved);
    }



    @Transactional
    public RequestResponse cancelRequest(Long id, String username) {
        // Lock request row trước khi kiểm tra điều kiện
        Request request = findRequestByIdForUpdate(id);
        User currentUser = findUserByUsername(username);

        if (!request.getRequester().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You are not the owner of this request");
        }
        if (request.getStatus() != RequestStatus.DRAFT && request.getStatus() != RequestStatus.SUBMITTED) {
            throw new BadRequestException("Can only cancel request in DRAFT or SUBMITTED status");
        }

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.CANCELLED);
        request.setUpdatedAt(LocalDateTime.now());
        Request saved = requestRepository.save(request);

        saveLog(saved, currentUser, LogAction.CANCELLED, oldStatus, RequestStatus.CANCELLED, null, null);

        return toResponse(saved);
    }

    // =========================================================================
    // SUBMIT
    // =========================================================================

    @Transactional
    public RequestResponse submitRequest(Long id, SubmitRequestRequest req, String username) {
        // Pessimistic lock: chỉ 1 transaction được submit cùng lúc
        Request request = findRequestByIdForUpdate(id);
        User currentUser = findUserByUsername(username);

        if (!request.getRequester().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You are not the owner of this request");
        }
        if (request.getStatus() != RequestStatus.DRAFT && request.getStatus() != RequestStatus.RETURNED) {
            throw new BadRequestException("Can only submit request in DRAFT or RETURNED status");
        }

        // Kiểm tra workflow có ít nhất 1 bước không
        List<WorkflowStep> steps = workflowStepRepository
                .findByWorkflowIdOrderByStepOrderAsc(request.getWorkflow().getId());
        if (steps.isEmpty()) {
            throw new BadRequestException("Workflow has no steps configured");
        }

        // Cập nhật note nếu có
        if (req != null && req.getNote() != null && !req.getNote().isBlank()) {
            request.setNote(req.getNote());
        }

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.SUBMITTED);
        request.setSubmittedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        // Xóa các phê duyệt/trả lại cũ để tránh trùng lặp/vi phạm unique constraint khi phê duyệt lại
        requestApprovalRepository.deleteByRequestId(request.getId());

        requestRepository.save(request);

        saveLog(request, currentUser, LogAction.SUBMITTED, oldStatus, RequestStatus.SUBMITTED, null, null);

        // Chuyển ngay sang IN_REVIEW bước 1
        advanceToNextStep(request, null);

        return toResponse(requestRepository.save(request));
    }

    // =========================================================================
    // APPROVE / REJECT / RETURN
    // =========================================================================

    @Transactional
    public RequestResponse approveRequest(Long id, ApprovalActionRequest req, String username, String ipAddress) {
        /*
         * RACE CONDITION FIX:
         * findByIdWithLock() phát lệnh SELECT ... FOR UPDATE.
         * Bất kỳ transaction nào khác cố approve/reject cùng request này
         * sẽ bị block ở DB-level cho đến khi transaction này commit/rollback.
         * Đảm bảo chỉ 1 người advance được bước tại một thời điểm.
         */
        Request request = findRequestByIdForUpdate(id);
        User currentUser = findUserByUsername(username);

        validateInReview(request);
        WorkflowStep step = getCurrentStep(request);
        validateAuthorizedApprover(currentUser, step, request.getRequester());
        validateNotAlreadyActed(request, step, currentUser);

        // Lưu approval record
        RequestApproval approval = RequestApproval.builder()
                .request(request)
                .workflowStep(step)
                .approver(currentUser)
                .action(ApprovalAction.APPROVE)
                .comment(req != null ? req.getComment() : null)
                .ipAddress(ipAddress)
                .actedAt(LocalDateTime.now())
                .build();
        requestApprovalRepository.save(approval);

        // Kiểm tra điều kiện tiến bước theo RoleApprovalMode
        if (shouldAdvance(request, step)) {
            processApproveAction(request, step, currentUser);
        }

        return toResponse(requestRepository.save(request));
    }

    @Transactional
    public RequestResponse rejectRequest(Long id, ApprovalActionRequest req, String username, String ipAddress) {
        // Lock trước khi xử lý reject
        Request request = findRequestByIdForUpdate(id);
        User currentUser = findUserByUsername(username);

        validateInReview(request);
        WorkflowStep step = getCurrentStep(request);
        validateAuthorizedApprover(currentUser, step, request.getRequester());
        validateNotAlreadyActed(request, step, currentUser);

        RequestApproval approval = RequestApproval.builder()
                .request(request)
                .workflowStep(step)
                .approver(currentUser)
                .action(ApprovalAction.REJECT)
                .comment(req != null ? req.getComment() : null)
                .ipAddress(ipAddress)
                .actedAt(LocalDateTime.now())
                .build();
        requestApprovalRepository.save(approval);

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.REJECTED);
        request.setCompletedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);

        saveLog(request, currentUser, LogAction.REJECTED, oldStatus, RequestStatus.REJECTED,
                request.getCurrentStep(), null);

        notificationService.notifyRequester(request, NotificationType.REQUEST_REJECTED,
                req != null ? req.getComment() : null);

        return toResponse(request);
    }

    @Transactional
    public RequestResponse returnRequest(Long id, ApprovalActionRequest req, String username, String ipAddress) {
        // Lock trước khi xử lý return
        Request request = findRequestByIdForUpdate(id);
        User currentUser = findUserByUsername(username);

        validateInReview(request);
        WorkflowStep step = getCurrentStep(request);
        validateAuthorizedApprover(currentUser, step, request.getRequester());
        validateNotAlreadyActed(request, step, currentUser);

        RequestApproval approval = RequestApproval.builder()
                .request(request)
                .workflowStep(step)
                .approver(currentUser)
                .action(ApprovalAction.RETURN)
                .comment(req != null ? req.getComment() : null)
                .ipAddress(ipAddress)
                .actedAt(LocalDateTime.now())
                .build();
        requestApprovalRepository.save(approval);

        RequestStatus oldStatus = request.getStatus();
        int oldStep = request.getCurrentStep();
        request.setStatus(RequestStatus.RETURNED);
        request.setCurrentStep(0);
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);

        saveLog(request, currentUser, LogAction.RETURNED, oldStatus, RequestStatus.RETURNED, oldStep, 0);

        notificationService.notifyRequester(request, NotificationType.REQUEST_RETURNED,
                req != null ? req.getComment() : null);

        return toResponse(request);
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<RequestResponse> getMyRequests(String username, RequestStatus status, Pageable pageable) {
        User currentUser = findUserByUsername(username);
        return requestRepository
                .findByRequesterIdWithFilter(currentUser.getId(), status, pageable)
                .map(RequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RequestResponse getRequestById(Long id, String username) {
        Request request = findRequestById(id);
        User currentUser = findUserByUsername(username);

        // Owner, approver hiện tại của bước, hoặc ADMIN/HR đều được xem
        boolean isOwner = request.getRequester().getId().equals(currentUser.getId());
        boolean hasRoleAdminOrHr = userRoleRepository.findByUserId(currentUser.getId()).stream()
                .anyMatch(ur -> "ADMIN".equals(ur.getRole().getCode()) || "HR".equals(ur.getRole().getCode()));

        boolean isApprover = false;
        if (request.getStatus() == RequestStatus.IN_REVIEW) {
            try {
                WorkflowStep step = getCurrentStep(request);
                isApprover = approverResolverService.isAuthorizedApprover(currentUser, step, request.getRequester());
            } catch (Exception ignored) {}
        }

        if (!isOwner && !hasRoleAdminOrHr && !isApprover) {
            // Kiểm tra xem đã từng approve bước nào chưa
            boolean hasActed = requestApprovalRepository.findByRequestId(id).stream()
                    .anyMatch(a -> a.getApprover().getId().equals(currentUser.getId()));
            if (!hasActed) {
                throw new BadRequestException("Access denied");
            }
        }

        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public List<PendingApprovalResponse> getPendingMyApproval(String username) {
        User currentUser = findUserByUsername(username);

        List<Request> inReviewRequests = requestRepository.findByStatus(RequestStatus.IN_REVIEW);

        return inReviewRequests.stream()
                .filter(request -> {
                    try {
                        WorkflowStep step = getCurrentStep(request);
                        return approverResolverService.isAuthorizedApprover(
                                currentUser, step, request.getRequester());
                    } catch (Exception e) {
                        return false;
                    }
                })
                .map(request -> {
                    WorkflowStep step = getCurrentStep(request);
                    return PendingApprovalResponse.builder()
                            .requestId(request.getId())
                            .requestNo(request.getRequestNo())
                            .title(request.getTitle())
                            .status(request.getStatus())
                            .priority(request.getPriority())
                            .submittedAt(request.getSubmittedAt())
                            .createdAt(request.getCreatedAt())
                            .requesterId(request.getRequester().getId())
                            .requesterFullName(request.getRequester().getFullName())
                            .requesterDepartment(request.getRequester().getDepartment() != null
                                    ? request.getRequester().getDepartment().getName() : null)
                            .requestTypeId(request.getRequestType().getId())
                            .requestTypeName(request.getRequestType().getName())
                            .currentStepId(step.getId())
                            .currentStepName(step.getName())
                            .currentStepOrder(step.getStepOrder())
                            .approverType(step.getApproverType())
                            .timeLimitHours(step.getTimeLimitHours())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<RequestResponse> getAllRequests(RequestStatus status, Long requestTypeId,
                                                Long requesterId, Long departmentId,
                                                LocalDateTime fromDate, LocalDateTime toDate,
                                                Pageable pageable) {
        return requestRepository.findAllWithFilters(
                status, requestTypeId, requesterId, departmentId, fromDate, toDate, pageable)
                .map(RequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<RequestLogResponse> getRequestLogs(Long requestId) {
        findRequestById(requestId); // validate exists
        return requestLogRepository.findByRequestIdOrderByCreatedAtAsc(requestId)
                .stream()
                .map(RequestLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RequestApprovalResponse> getRequestApprovals(Long requestId) {
        findRequestById(requestId); // validate exists
        return requestApprovalRepository.findByRequestId(requestId)
                .stream()
                .map(RequestApprovalResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Chuyển sang bước tiếp theo trong workflow.
     * Nếu không còn bước nào → APPROVED.
     */
    private void advanceToNextStep(Request request, User actor) {
        int nextStepOrder = request.getCurrentStep() + 1;
        int oldStep = request.getCurrentStep();
        RequestStatus oldStatus = request.getStatus();

        WorkflowStep nextStep = workflowStepRepository
                .findByWorkflowIdAndStepOrder(request.getWorkflow().getId(), nextStepOrder)
                .orElse(null);

        if (nextStep == null) {
            // Không còn bước → hoàn thành
            request.setStatus(RequestStatus.APPROVED);
            request.setCompletedAt(LocalDateTime.now());
            request.setUpdatedAt(LocalDateTime.now());

            saveLog(request, actor, LogAction.APPROVED, oldStatus, RequestStatus.APPROVED,
                    oldStep, request.getCurrentStep());

            notificationService.notifyRequester(request, NotificationType.REQUEST_APPROVED, null);
        } else {
            // Chuyển sang bước tiếp
            request.setCurrentStep(nextStepOrder);
            request.setStatus(RequestStatus.IN_REVIEW);
            request.setUpdatedAt(LocalDateTime.now());

            saveLog(request, actor, LogAction.STEP_ADVANCED, oldStatus, RequestStatus.IN_REVIEW,
                    oldStep, nextStepOrder);

            // Gửi thông báo cho approver bước mới nếu cần
            if (Boolean.TRUE.equals(nextStep.getNotifyOnEnter())) {
                notificationService.notifyApprovers(request, nextStep);
            }
        }
    }

    /**
     * Xử lý logic sau khi điều kiện approve bước được thỏa mãn.
     */
    private void processApproveAction(Request request, WorkflowStep step, User actor) {
        if (step.getActionOnApprove() == ActionOnApprove.COMPLETE) {
            // Bước cuối cùng → complete ngay
            RequestStatus oldStatus = request.getStatus();
            request.setStatus(RequestStatus.APPROVED);
            request.setCompletedAt(LocalDateTime.now());
            request.setUpdatedAt(LocalDateTime.now());

            saveLog(request, actor, LogAction.APPROVED, oldStatus, RequestStatus.APPROVED,
                    request.getCurrentStep(), null);

            notificationService.notifyRequester(request, NotificationType.REQUEST_APPROVED, null);
        } else {
            // NEXT_STEP → chuyển bước
            advanceToNextStep(request, actor);
        }
    }

    /**
     * Kiểm tra điều kiện có đủ approve để tiến bước không.
     * Phụ thuộc vào RoleApprovalMode của bước.
     */
    private boolean shouldAdvance(Request request, WorkflowStep step) {
        // Các type không phải ROLE → chỉ cần 1 người approve là đủ
        if (step.getApproverType() != ApproverType.ROLE) {
            return true;
        }

        RoleApprovalMode mode = step.getRoleApprovalMode();
        if (mode == null) {
            return true;
        }

        long approvedCount = requestApprovalRepository.countByRequestIdAndWorkflowStepIdAndAction(
                request.getId(), step.getId(), ApprovalAction.APPROVE);

        return switch (mode) {
            case ANY_ONE ->
                // Chỉ cần 1 người approve
                true;
            case THRESHOLD ->
                // Cần đủ số lượng threshold
                approvedCount >= (step.getRoleApprovalThreshold() != null ? step.getRoleApprovalThreshold() : 1);
            case ALL -> {
                // Tất cả user có role đó phải approve
                int totalApprovers = approverResolverService.countTotalApprovers(step, request.getRequester());
                yield approvedCount >= totalApprovers;
            }
        };
    }

    private void validateInReview(Request request) {
        if (request.getStatus() != RequestStatus.IN_REVIEW) {
            throw new BadRequestException("Request is not in IN_REVIEW status. Current status: " + request.getStatus());
        }
    }

    private WorkflowStep getCurrentStep(Request request) {
        return workflowStepRepository
                .findByWorkflowIdAndStepOrder(request.getWorkflow().getId(), request.getCurrentStep())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Workflow step not found for order: " + request.getCurrentStep()));
    }

    private void validateAuthorizedApprover(User currentUser, WorkflowStep step, User requester) {
        if (!approverResolverService.isAuthorizedApprover(currentUser, step, requester)) {
            throw new BadRequestException("You are not authorized to approve this step");
        }
    }

    private void validateNotAlreadyActed(Request request, WorkflowStep step, User currentUser) {
        if (requestApprovalRepository.existsByRequestIdAndWorkflowStepIdAndApproverId(
                request.getId(), step.getId(), currentUser.getId())) {
            throw new BadRequestException("You have already acted on this step");
        }
    }

    private void saveLog(Request request, User actor, LogAction action,
                         RequestStatus oldStatus, RequestStatus newStatus,
                         Integer stepFrom, Integer stepTo) {
        RequestLog log = RequestLog.builder()
                .request(request)
                .actor(actor)
                .action(action)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .stepFrom(stepFrom)
                .stepTo(stepTo)
                .createdAt(LocalDateTime.now())
                .build();
        requestLogRepository.save(log);
    }

    private String generateRequestNo(RequestType requestType) {
        /*
         * RACE CONDITION FIX cho requestNo:
         * 1. Lock toàn bộ rows của request_type+year này (SELECT FOR UPDATE)
         *    → các transaction song song phải đợi nhau.
         * 2. Đếm lại sau khi đã có lock → count chính xác.
         * 3. Nếu vẫn xảy ra trùng (ví dụ: batch insert), unique constraint
         *    trên request_no sẽ throw DataIntegrityViolationException → retry.
         */
        int year = Year.now().getValue();
        // Lock các rows hiện tại để đảm bảo count chính xác
        List<Request> lockedRows = requestRepository.findByRequestTypeAndYearWithLock(
                requestType.getId(), year);
        long count = lockedRows.size();
        return String.format("%s-%d-%05d", requestType.getCode(), year, count + 1);
    }

    /**
     * Wrap createRequest với retry logic cho trường hợp requestNo trùng.
     * Tối đa 3 lần retry với backoff ngắn.
     */
    @Transactional
    public RequestResponse createRequestWithRetry(CreateRequestRequest req, String username) {
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return createRequest(req, username);
            } catch (DataIntegrityViolationException ex) {
                if (attempt == maxRetries) {
                    throw new BadRequestException(
                            "Failed to generate unique request number after " + maxRetries + " attempts");
                }
                // Backoff ngắn trước khi thử lại
                try { Thread.sleep(50L * attempt); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        throw new BadRequestException("Unexpected error during request creation");
    }

    private Request findRequestById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + id));
    }

    /**
     * Dùng trong mọi thao tác thay đổi trạng thái để thiết lập DB-level lock.
     * Ngăn concurrent modification bằng SELECT ... FOR UPDATE.
     */
    private Request findRequestByIdForUpdate(Long id) {
        return requestRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + id));
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private RequestResponse toResponse(Request request) {
        RequestResponse response = RequestResponse.fromEntity(request);
        try {
            response.setWorkflowSteps(resolveWorkflowSteps(request));
        } catch (Exception e) {
            System.err.println("Could not resolve workflow steps: " + e.getMessage());
        }
        return response;
    }

    private List<RequestResponse.ResolvedStep> resolveWorkflowSteps(Request request) {
        List<WorkflowStep> steps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(request.getWorkflow().getId());
        List<RequestResponse.ResolvedStep> resolvedSteps = new ArrayList<>();
        
        for (WorkflowStep step : steps) {
            List<User> approvers = approverResolverService.findApproversForStep(step, request.getRequester());
            List<String> resolvedApproverNames = approvers.stream()
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .collect(Collectors.toList());

            String status = "NOT_STARTED";
            if (request.getStatus() == RequestStatus.APPROVED) {
                status = "APPROVED";
            } else if (step.getStepOrder() < request.getCurrentStep()) {
                status = "APPROVED";
            } else if (step.getStepOrder().equals(request.getCurrentStep())) {
                if (request.getStatus() == RequestStatus.IN_REVIEW) {
                    status = "PENDING";
                } else if (request.getStatus() == RequestStatus.REJECTED) {
                    status = "REJECTED";
                } else if (request.getStatus() == RequestStatus.RETURNED) {
                    status = "RETURNED";
                }
            }

            resolvedSteps.add(RequestResponse.ResolvedStep.builder()
                    .id(step.getId())
                    .stepOrder(step.getStepOrder())
                    .name(step.getName())
                    .approverType(step.getApproverType().name())
                    .resolvedApprovers(resolvedApproverNames)
                    .status(status)
                    .build());
        }
        return resolvedSteps;
    }

}
