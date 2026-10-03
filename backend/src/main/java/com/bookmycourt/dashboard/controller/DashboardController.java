package com.bookmycourt.dashboard.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.dashboard.dto.DashboardStatsResponse;
import com.bookmycourt.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/stats")
    public ApiResponse<DashboardStatsResponse> getStats() {
        return ApiResponse.success("Dashboard stats loaded", dashboard.getStats());
    }
}
