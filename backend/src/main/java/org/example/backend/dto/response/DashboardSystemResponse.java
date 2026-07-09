package org.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSystemResponse {
    private long totalRequests;
    private Map<String, Long> requestsByStatus;
    private Map<String, Long> requestsByType;
    private Map<String, Long> requestsByDepartment;
}
