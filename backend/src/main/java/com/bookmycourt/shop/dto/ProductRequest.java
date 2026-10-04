package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 200) String name,
        @Size(max = 1000) String description,
        @Size(max = 100) String brand,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal taxRate,
        @Pattern(regexp = "^$|^\\d{4,8}$", message = "HSN must be 4-8 digits") String hsnCode,
        Boolean taxInclusive
) {
}
