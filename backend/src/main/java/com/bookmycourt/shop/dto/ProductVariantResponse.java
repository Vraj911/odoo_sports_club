package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductVariantResponse(
        UUID id,
        UUID productId,
        String productName,
        String sku,
        String variantName,
        String attributes,
        BigDecimal price,
        BigDecimal taxRate,
        Integer onHand,
        Integer reserved,
        Integer availableStock,
        Integer reorderLevel,
        boolean isLowStock,
        boolean active
) {
}
