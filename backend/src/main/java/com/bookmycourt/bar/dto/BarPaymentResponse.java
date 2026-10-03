package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BarPaymentResponse(
        UUID id,
        String method,
        BigDecimal amount,
        BigDecimal tendered,
        BigDecimal changeGiven,
        String reference,
        String receivedBy,
        Instant createdAt
) {
}
