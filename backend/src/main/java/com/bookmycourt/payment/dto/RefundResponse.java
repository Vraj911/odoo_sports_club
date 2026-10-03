package com.bookmycourt.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RefundResponse(
        UUID id,
        UUID paymentId,
        BigDecimal amount,
        String reason,
        String status,
        String reference,
        Instant createdAt,
        Instant processedAt
) {
}
