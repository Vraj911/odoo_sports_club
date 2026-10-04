package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ShopOrderLineResponse(
        UUID id,
        UUID productVariantId,
        String productName,
        String variantName,
        String sku,
        String hsnCode,
        Integer quantity,
        Integer returnedQuantity,
        BigDecimal unitPrice,
        BigDecimal taxRate,
        boolean taxInclusive,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal lineTotal
) {
}