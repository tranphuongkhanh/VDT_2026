package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.response.RequestLogResponse;
import org.example.backend.dto.response.RequestResponse;
import org.example.backend.enums.LogAction;
import org.example.backend.enums.RequestStatus;
import org.example.backend.repository.RequestLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final RequestService requestService;
    private final RequestLogRepository requestLogRepository;

    @Transactional(readOnly = true)
    public Page<RequestResponse> getRequestsReport(RequestStatus status, Long requestTypeId,
                                                   Long requesterId, Long departmentId,
                                                   LocalDateTime fromDate, LocalDateTime toDate,
                                                   Pageable pageable) {
        // Reuse the logic from requestService which already has the query
        return requestService.getAllRequests(status, requestTypeId, requesterId, departmentId, fromDate, toDate, pageable);
    }

    @Transactional(readOnly = true)
    public Page<RequestLogResponse> getAuditLogReport(Long requestId, Long actorId, LogAction action, Pageable pageable) {
        return requestLogRepository.findAllWithFilters(requestId, actorId, action, pageable)
                .map(RequestLogResponse::fromEntity);
    }
}
