package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MenuItemResponse(
        UUID id,
        String category,
        String name,
        String description,
        BigDecimal price,
        BigDecimal taxRate,
        boolean isAvailable,
        String station,
        boolean taxInclusive,
        Instant createdAt
) {
}