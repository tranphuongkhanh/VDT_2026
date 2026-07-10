package org.example.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.request.ApprovalActionRequest;
import org.example.backend.dto.request.CreateRequestRequest;
import org.example.backend.dto.request.SubmitRequestRequest;
import org.example.backend.dto.request.UpdateRequestRequest;
import org.example.backend.dto.response.PendingApprovalResponse;
import org.example.backend.dto.response.RequestApprovalResponse;
import org.example.backend.dto.response.RequestLogResponse;
import org.example.backend.dto.response.RequestResponse;
import org.example.backend.enums.RequestStatus;
import org.example.backend.service.RequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;

    // -------------------------------------------------------------------------
    // MY REQUESTS
    // -------------------------------------------------------------------------

    /**
     * Danh sách yêu cầu của tôi (filter theo trạng thái)
     */
    @GetMapping
    public ResponseEntity<Page<RequestResponse>> getMyRequests(
            @RequestParam(required = false) RequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.getMyRequests(userDetails.getUsername(), status, pageable));
    }

    /**
     * Tạo yêu cầu mới (DRAFT)
     */
    @PostMapping
    public ResponseEntity<RequestResponse> createRequest(
            @Valid @RequestBody CreateRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requestService.createRequestWithRetry(request, userDetails.getUsername()));
    }

    /**
     * Chi tiết yêu cầu
     */
    @GetMapping("/{id}")
    public ResponseEntity<RequestResponse> getRequestById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.getRequestById(id, userDetails.getUsername()));
    }

    /**
     * Cập nhật yêu cầu (DRAFT hoặc RETURNED)
     */
    @PutMapping("/{id}")
    public ResponseEntity<RequestResponse> updateRequest(
            @PathVariable Long id,
            @RequestBody UpdateRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.updateRequest(id, request, userDetails.getUsername()));
    }

    /**
     * Gửi yêu cầu
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<RequestResponse> submitRequest(
            @PathVariable Long id,
            @RequestBody(required = false) SubmitRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.submitRequest(id, request, userDetails.getUsername()));
    }



    /**
     * Hủy yêu cầu
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<RequestResponse> cancelRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.cancelRequest(id, userDetails.getUsername()));
    }

    // -------------------------------------------------------------------------
    // PENDING APPROVAL
    // -------------------------------------------------------------------------

    /**
     * Danh sách yêu cầu cần tôi phê duyệt
     */
    @GetMapping("/pending-my-approval")
    public ResponseEntity<List<PendingApprovalResponse>> getPendingMyApproval(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.getPendingMyApproval(userDetails.getUsername()));
    }

    // -------------------------------------------------------------------------
    // APPROVAL ACTIONS
    // -------------------------------------------------------------------------

    /**
     * Phê duyệt yêu cầu
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<RequestResponse> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        String ipAddress = extractClientIp(httpRequest);
        return ResponseEntity.ok(requestService.approveRequest(id, request, userDetails.getUsername(), ipAddress));
    }

    /**
     * Từ chối yêu cầu
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<RequestResponse> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        String ipAddress = extractClientIp(httpRequest);
        return ResponseEntity.ok(requestService.rejectRequest(id, request, userDetails.getUsername(), ipAddress));
    }

    /**
     * Trả lại yêu cầu để bổ sung
     */
    @PostMapping("/{id}/return")
    public ResponseEntity<RequestResponse> returnRequest(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        String ipAddress = extractClientIp(httpRequest);
        return ResponseEntity.ok(requestService.returnRequest(id, request, userDetails.getUsername(), ipAddress));
    }

    // -------------------------------------------------------------------------
    // LOGS & HISTORY
    // -------------------------------------------------------------------------

    /**
     * GET /api/requests/{id}/logs — Lịch sử thay đổi trạng thái
     */
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<RequestLogResponse>> getRequestLogs(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.getRequestLogs(id));
    }

    /**
     * GET /api/requests/{id}/approvals — Timeline phê duyệt chi tiết
     */
    @GetMapping("/{id}/approvals")
    public ResponseEntity<List<RequestApprovalResponse>> getRequestApprovals(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(requestService.getRequestApprovals(id));
    }

    // -------------------------------------------------------------------------
    // ADMIN
    // -------------------------------------------------------------------------

    /**
     * GET /api/requests/all — Danh sách toàn bộ yêu cầu (ADMIN)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<RequestResponse>> getAllRequests(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) Long requestTypeId,
            @RequestParam(required = false) Long requesterId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(requestService.getAllRequests(
                status, requestTypeId, requesterId, departmentId, fromDate, toDate, pageable));
    }

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
