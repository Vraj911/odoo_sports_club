package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** amount = value applied to the bill. For CASH, tendered (>= amount) gives the change. CARD/UPI need a reference. */
public record PaymentLineRequest(
        @NotBlank String method,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @DecimalMin("0.01") BigDecimal tendered,
        @Size(max = 100) String reference
) {
}
