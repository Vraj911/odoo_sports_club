package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** One leg of a split payment (SHP-06). For CASH, tendered >= amount gives the change. */
public record PosPaymentLine(
        @NotBlank String method,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @DecimalMin("0.01") BigDecimal tendered,
        @Size(max = 100) String reference
) {
}
