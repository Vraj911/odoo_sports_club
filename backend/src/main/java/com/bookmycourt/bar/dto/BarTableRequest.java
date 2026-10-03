package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BarTableRequest(
        @NotBlank String tableNumber,
        @NotNull @Min(1) Integer capacity,
        String status
) {
}
