package com.bookmycourt.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExpenseRequest(
        @NotBlank String expenseType,
        String description,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String paymentMethod,
        Instant incurredAt,
        UUID recordedByUserId,
        String notes
) {
}
