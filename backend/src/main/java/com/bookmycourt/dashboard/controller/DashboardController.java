package com.bookmycourt.dashboard.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.dashboard.dto.DashboardStatsResponse;
import com.bookmycourt.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    /**
     * SRS: GET /dashboard?range=today. /stats is kept so the current frontend
     * keeps working.
     */
    @GetMapping({"", "/stats"})
    public ApiResponse<DashboardStatsResponse> getStats(@RequestParam(defaultValue = "today") String range) {
        return ApiResponse.success("Dashboard stats loaded", dashboard.getStats(range));
    }
}
