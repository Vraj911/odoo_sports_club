package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockMovementRequest(
        @NotNull UUID productVariantId,
        @NotBlank String movementType,
        @NotNull @Min(1) Integer quantity,
        @NotBlank String sourceType,
        UUID sourceId,
        UUID performedByUserId,
        String notes
) {
}
