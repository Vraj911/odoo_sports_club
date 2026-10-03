package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String category,
        String name,
        String description,
        String brand,
        BigDecimal taxRate,
        boolean active,
        List<ProductVariantResponse> variants,
        Instant createdAt
) {
}
