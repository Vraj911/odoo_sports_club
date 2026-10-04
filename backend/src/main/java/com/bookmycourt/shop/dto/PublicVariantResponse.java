package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Public view (WEB-04 / SHP-08): price + stock STATUS only - never on-hand / reserved / reorder numbers. */
public record PublicVariantResponse(
        UUID id,
        String sku,
        String variantName,
        String attributes,
        BigDecimal price,
        BigDecimal taxRate,
        boolean taxInclusive,
        String stockStatus          // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
) {
}
