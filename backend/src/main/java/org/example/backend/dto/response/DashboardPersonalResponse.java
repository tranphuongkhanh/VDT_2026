package org.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardPersonalResponse {
    private long totalMyRequests;
    private long myDraftRequests;
    private long myPendingRequests;
    private long myApprovedRequests;
    private long myRejectedRequests;
    private long myReturnedRequests;
    private long myCancelledRequests;
    private long pendingMyApproval;
    private List<RequestResponse> recentRequests;
}
