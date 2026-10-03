package com.bookmycourt.crm.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record QuoteResponse(
        UUID id,
        UUID leadId,
        String leadName,
        LocalDate validUntil,
        BigDecimal total,
        String status,
        String notes,
        Instant createdAt,
        List<QuoteLineResponse> lines
) {
}
