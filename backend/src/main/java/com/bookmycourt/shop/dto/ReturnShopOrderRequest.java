package com.bookmycourt.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * SHP-13: return / exchange. lines == null/empty returns everything not yet returned.
 * damaged = true writes the stock off instead of putting it back on the shelf.
 */
public record ReturnShopOrderRequest(
        @NotBlank @Size(max = 255) String reason,
        Boolean damaged,
        List<@Valid Line> lines
) {
    public record Line(@NotNull UUID lineId, @NotNull @Min(1) Integer quantity, Boolean damaged) {
    }
}
