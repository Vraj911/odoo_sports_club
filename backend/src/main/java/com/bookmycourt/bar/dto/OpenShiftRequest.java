package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record OpenShiftRequest(
        @NotNull UUID staffUserId,
        @NotNull @DecimalMin("0.00") BigDecimal openingFloat,
        String scope
) {
}
