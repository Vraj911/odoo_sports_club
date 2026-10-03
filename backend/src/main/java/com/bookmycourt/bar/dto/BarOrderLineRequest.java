package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record BarOrderLineRequest(
        @NotNull UUID menuItemId,
        @NotNull @DecimalMin("0.001") BigDecimal quantity
) {
}
