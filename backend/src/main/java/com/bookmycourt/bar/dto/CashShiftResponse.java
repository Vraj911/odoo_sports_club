package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CashShiftResponse(
        UUID id,
        UUID staffUserId,
        String staffName,
        String scope,
        OffsetDateTime openedAt,
        OffsetDateTime closedAt,
        BigDecimal openingFloat,
        BigDecimal expectedCash,
        BigDecimal countedCash,
        BigDecimal variance,
        String status
) {
}
