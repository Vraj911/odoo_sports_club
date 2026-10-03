package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TaxRateRequest(
        @NotBlank String name,
        @NotNull @DecimalMin("0.0") BigDecimal rate,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Boolean isActive
) {
}
