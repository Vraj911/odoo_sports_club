package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** BAR-13 Z-report: what the bar actually earned that day. */
public record DailyReportResponse(
        LocalDate date,
        boolean closed,
        Instant closedAt,
        int orderCount,
        BigDecimal grossSales,
        BigDecimal discounts,
        BigDecimal tax,
        BigDecimal netSales,
        Map<String, BigDecimal> byPaymentMethod,
        Map<String, BigDecimal> byCategory,
        Map<String, BigDecimal> byStaff,
        List<TabResponse> openTabs,
        long unpaidOrders,
        long openShifts
) {
}
