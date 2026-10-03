package com.bookmycourt.dashboard.dto;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardStatsResponse(
        long totalMembers,
        long activeMemberships,
        long totalBookingsToday,
        long totalBookingsAllTime,
        long openBarOrders,
        BigDecimal todayBarRevenue,
        long lowStockProductsCount,
        long openLeadsCount,
        long convertedLeadsCount,
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal netProfit,
        Map<String, Object> extraMetrics
) {
}
