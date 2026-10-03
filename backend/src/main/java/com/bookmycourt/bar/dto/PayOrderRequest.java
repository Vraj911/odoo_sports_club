package com.bookmycourt.bar.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Several payment lines = split payment across cash / card / UPI. Same idempotencyKey = no double charge (NFR-01). */
public record PayOrderRequest(
        @Size(max = 100) String idempotencyKey,
        List<@Valid PaymentLineRequest> payments
) {
}
