package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CashMovementRequest(
        @NotBlank @Pattern(regexp = "IN|OUT", message = "type must be IN or OUT") String type,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank @Size(max = 255) String reason
) {
}
