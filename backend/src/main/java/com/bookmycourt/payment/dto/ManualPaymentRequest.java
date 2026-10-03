package com.bookmycourt.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ManualPaymentRequest(
        @NotBlank String sourceType,
        @NotNull UUID sourceId,
        UUID memberId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String method,
        String reference,
        BigDecimal tendered,
        UUID cashShiftId
) {
}
