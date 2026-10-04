package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Partial update (null = unchanged). SKU is immutable. Price / tax changes are audited. */
public record ProductVariantUpdateRequest(
        @Size(max = 150) String variantName,
        String attributes,
        @DecimalMin("0.0") BigDecimal price,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal taxRate,
        @Min(0) Integer reorderLevel,
        Boolean active,
        Boolean quickSale
) {
}
