package com.bookmycourt.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID memberId,
        String memberName,
        UUID invoiceId,
        String sourceType,
        UUID sourceId,
        BigDecimal amount,
        String method,
        String gateway,
        String gatewayTransactionId,
        String status,
        Instant paidAt,
        String reference,
        Instant createdAt
) {
}
