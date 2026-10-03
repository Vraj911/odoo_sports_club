package com.bookmycourt.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record QuoteLineRequest(
        @NotBlank String description,
        @NotNull BigDecimal quantity,
        @NotNull BigDecimal unitPrice,
        BigDecimal taxPercent
) {
}
