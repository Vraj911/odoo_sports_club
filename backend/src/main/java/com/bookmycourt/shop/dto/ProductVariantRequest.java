package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductVariantRequest(
        @NotNull UUID productId,
        @NotBlank String sku,
        @NotBlank String variantName,
        String attributes,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        BigDecimal taxRate,
        Integer initialStock,
        Integer reorderLevel
) {
}
