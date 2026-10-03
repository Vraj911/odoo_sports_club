package com.bookmycourt.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePaymentRequest(
        UUID memberId,
        UUID invoiceId,
        @NotBlank String sourceType,
        UUID sourceId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String method,
        String gateway,
        String gatewayTransactionId,
        String reference
) {
}
