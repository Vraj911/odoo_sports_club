package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TabResponse(
        UUID id,
        UUID memberId,
        String memberName,
        String guestName,
        UUID tableId,
        String tableNumber,
        String status,
        Instant openedAt,
        BigDecimal limitAmount,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal outstanding,
        List<UUID> orderIds
) {
}
