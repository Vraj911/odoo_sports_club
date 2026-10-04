package com.bookmycourt.shop.dto;

import java.math.BigDecimal;

/** RPT-04 inventory KPIs. stockValue is at selling price (no cost price is modelled yet). */
public record InventorySummaryResponse(
        long activeVariants,
        long lowStockCount,
        long outOfStockCount,
        BigDecimal stockValue,
        long pendingOnlineOrders
) {
}
