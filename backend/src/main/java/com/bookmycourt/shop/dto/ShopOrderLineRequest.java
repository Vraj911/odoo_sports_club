package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ShopOrderLineRequest(
        @NotNull UUID productVariantId,
        @NotNull @Min(1) Integer quantity
) {
}
