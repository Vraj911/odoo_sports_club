package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ShopOrderLineResponse(
        UUID id,
        UUID productVariantId,
        String productName,
        String variantName,
        String sku,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal taxRate,
        BigDecimal discountAmount,
        BigDecimal lineTotal
) {
}
