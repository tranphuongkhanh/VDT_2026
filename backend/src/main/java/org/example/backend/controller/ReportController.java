package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.response.RequestLogResponse;
import org.example.backend.dto.response.RequestResponse;
import org.example.backend.enums.LogAction;
import org.example.backend.enums.RequestStatus;
import org.example.backend.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<RequestResponse>> getRequestsReport(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) Long requestTypeId,
            @RequestParam(required = false) Long requesterId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reportService.getRequestsReport(
                status, requestTypeId, requesterId, departmentId, fromDate, toDate, pageable));
    }

    @GetMapping("/audit-log")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<RequestLogResponse>> getAuditLogReport(
            @RequestParam(required = false) Long requestId,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) LogAction action,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reportService.getAuditLogReport(requestId, actorId, action, pageable));
    }
}
