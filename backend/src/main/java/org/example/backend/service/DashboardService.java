package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.response.DashboardPersonalResponse;
import org.example.backend.dto.response.DashboardSystemResponse;
import org.example.backend.entity.User;
import org.example.backend.enums.RequestStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.RequestRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RequestRepository requestRepository;
    private final RequestService requestService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardPersonalResponse getPersonalDashboard(String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        long totalMyRequests = requestRepository.countByRequesterId(currentUser.getId());
        long myDraftRequests = requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.DRAFT);
        long myPendingRequests = requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.SUBMITTED)
                               + requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.IN_REVIEW);
        long myApprovedRequests = requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.APPROVED);
        long myRejectedRequests = requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.REJECTED);
        long myReturnedRequests = requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.RETURNED);
        long myCancelledRequests = requestRepository.countByRequesterIdAndStatus(currentUser.getId(), RequestStatus.CANCELLED);
        
        long pendingMyApproval = requestService.getPendingMyApproval(username).size();
        
        var recentRequests = requestRepository.findByRequesterIdWithFilter(
                currentUser.getId(), null, PageRequest.of(0, 5))
                .map(org.example.backend.dto.response.RequestResponse::fromEntity)
                .getContent();

        return DashboardPersonalResponse.builder()
                .totalMyRequests(totalMyRequests)
                .myDraftRequests(myDraftRequests)
                .myPendingRequests(myPendingRequests)
                .myApprovedRequests(myApprovedRequests)
                .myRejectedRequests(myRejectedRequests)
                .myReturnedRequests(myReturnedRequests)
                .myCancelledRequests(myCancelledRequests)
                .pendingMyApproval(pendingMyApproval)
                .recentRequests(recentRequests)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardSystemResponse getSystemDashboard() {
        long totalRequests = requestRepository.count();

        Map<String, Long> requestsByStatus = new HashMap<>();
        for (Object[] row : requestRepository.countRequestsByStatus()) {
            if (row[0] != null) {
                RequestStatus status = (RequestStatus) row[0];
                requestsByStatus.put(status.name(), (Long) row[1]);
            }
        }

        Map<String, Long> requestsByType = new HashMap<>();
        for (Object[] row : requestRepository.countRequestsByType()) {
            requestsByType.put((String) row[0], (Long) row[1]);
        }

        Map<String, Long> requestsByDepartment = new HashMap<>();
        for (Object[] row : requestRepository.countRequestsByDepartment()) {
            requestsByDepartment.put((String) row[0], (Long) row[1]);
        }

        return DashboardSystemResponse.builder()
                .totalRequests(totalRequests)
                .requestsByStatus(requestsByStatus)
                .requestsByType(requestsByType)
                .requestsByDepartment(requestsByDepartment)
                .build();
    }
}
