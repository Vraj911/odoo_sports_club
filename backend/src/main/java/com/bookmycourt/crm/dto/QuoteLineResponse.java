package com.bookmycourt.crm.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record QuoteLineResponse(
        UUID id,
        String description,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal taxPercent,
        BigDecimal lineTotal
) {
}
