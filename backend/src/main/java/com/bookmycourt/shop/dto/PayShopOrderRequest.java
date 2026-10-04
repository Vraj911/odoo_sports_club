package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Staff takes payment for an online order at the desk (full amount). */
public record PayShopOrderRequest(
        @NotBlank String method,
        BigDecimal tendered,
        @Size(max = 100) String reference
) {
}
