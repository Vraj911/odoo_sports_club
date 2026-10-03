package com.bookmycourt.payment.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record UpdatePaymentStatusRequest(
        @NotBlank String status,
        String gatewayTransactionId,
        String reference,
        UUID receivedByUserId
) {
}
