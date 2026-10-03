package com.bookmycourt.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InvoiceLineResponse(
        UUID id,
        String description,
        String sourceType,
        UUID sourceId,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal lineTotal,
        Instant createdAt
) {
}
