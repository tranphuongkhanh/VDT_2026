package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.response.DashboardPersonalResponse;
import org.example.backend.dto.response.DashboardSystemResponse;
import org.example.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/me")
    public ResponseEntity<DashboardPersonalResponse> getPersonalDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dashboardService.getPersonalDashboard(userDetails.getUsername()));
    }

    @GetMapping("/system")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<DashboardSystemResponse> getSystemDashboard() {
        return ResponseEntity.ok(dashboardService.getSystemDashboard());
    }
}
