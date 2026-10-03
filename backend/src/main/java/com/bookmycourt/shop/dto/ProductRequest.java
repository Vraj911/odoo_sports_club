package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank String category,
        @NotBlank String name,
        String description,
        String brand,
        @DecimalMin("0.0") BigDecimal taxRate
) {
}
