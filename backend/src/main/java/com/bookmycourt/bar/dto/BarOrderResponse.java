package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BarOrderResponse(
        UUID id,
        String orderNumber,
        UUID tableId,
        String tableNumber,
        UUID memberId,
        String memberName,
        String guestName,
        String status,
        BigDecimal memberDiscountAmount,
        BigDecimal subtotal,
        BigDecimal taxTotal,
        BigDecimal total,
        List<BarOrderLineResponse> items,
        Instant createdAt
) {
}
