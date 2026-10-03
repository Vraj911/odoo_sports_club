package com.bookmycourt.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record InvoiceLineRequest(
        @NotBlank String description,
        String sourceType,
        UUID sourceId,
        @NotNull @DecimalMin("0.001") BigDecimal quantity,
        @NotNull @DecimalMin("0.0") BigDecimal unitPrice,
        BigDecimal taxRate
) {
}
