package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * movementType: RECEIPT, ADJUSTMENT_IN, ADJUSTMENT_OUT or DAMAGE. Adjustments and damage need notes (the reason).
 * performedByUserId was removed - the user is taken from the login (SHP-04).
 * Sales / returns / reservations are created by the order flow only, never by hand.
 */
public record StockMovementRequest(
        @NotNull UUID productVariantId,
        @NotBlank String movementType,
        @NotNull @Min(1) Integer quantity,
        @Size(max = 50) String sourceType,
        UUID sourceId,
        @Size(max = 255) String notes
) {
}