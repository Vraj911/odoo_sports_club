package com.bookmycourt.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
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
        Map<String, Object> extraMetrics,
        // --- RPT-01: today / week / month with previous-period comparison ---
        String range,
        Period period,
        Kpis current,
        Kpis previous
) {

    /**
     * from inclusive, to inclusive (club-local dates).
     */
    public record Period(LocalDate from, LocalDate to) {

    }

    public record Kpis(
            BigDecimal revenue,
            Map<String, BigDecimal> revenueBySource,
            Map<String, BigDecimal> revenueByMethod,
            BigDecimal expenses,
            BigDecimal net,
            long bookings,
            long cancelledBookings,
            long noShowBookings,
            double cancellationRate,
            double noShowRate
    ) {

    }
}
