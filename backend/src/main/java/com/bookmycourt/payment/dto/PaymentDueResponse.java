package com.bookmycourt.payment.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PaymentDueResponse(
        UUID id,
        String refType,
        UUID refId,
        UUID memberId,
        BigDecimal amount,
        OffsetDateTime dueSince,
        String status,
        String reason
) {
}
