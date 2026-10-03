package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record MenuItemRequest(
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal taxRate,
        Boolean isAvailable,
        @Pattern(regexp = "KITCHEN|BAR", message = "station must be KITCHEN or BAR") String station,
        Boolean taxInclusive
) {
}