package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BarOrderResponse(
        UUID id,
        String orderNumber,              // doubles as the bill number on receipts (BAR-10)
        UUID tableId,
        String tableNumber,
        UUID memberId,
        String memberName,
        String guestName,
        String status,
        BigDecimal memberDiscountPercent,
        String discountSource,
        BigDecimal memberDiscountAmount,
        BigDecimal subtotal,
        BigDecimal taxTotal,
        BigDecimal total,
        BigDecimal amountPaid,
        BigDecimal amountDue,
        UUID tabId,
        List<BarOrderLineResponse> items,
        List<BarPaymentResponse> payments,
        Instant createdAt
) {
}
