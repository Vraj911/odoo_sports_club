package com.bookmycourt.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Counter sale. Pay with EITHER the legacy single paymentMethod (+tendered, +paymentReference) OR a payments list
 * for split payments (SHP-06). The payments must add up to the bill total. CARD / UPI need a reference (FIN-03).
 */
public record PosCheckoutRequest(
        UUID memberId,
        String guestName,
        String guestPhone,
        @NotEmpty List<@Valid ShopOrderLineRequest> items,
        String paymentMethod,
        BigDecimal tendered,
        @Size(max = 100) String paymentReference,
        List<@Valid PosPaymentLine> payments,
        @Size(max = 100) String idempotencyKey
) {
}