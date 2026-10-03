package com.bookmycourt.shop.dto;

import java.time.Instant;
import java.util.UUID;

public record StockMovementResponse(
        UUID id,
        UUID productVariantId,
        String variantName,
        String sku,
        String movementType,
        Integer quantity,
        String sourceType,
        UUID sourceId,
        String performedByName,
        String notes,
        Instant createdAt
) {
}
