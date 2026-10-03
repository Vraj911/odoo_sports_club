package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PosCheckoutRequest(
        UUID memberId,
        String guestName,
        String guestPhone,
        @NotEmpty List<ShopOrderLineRequest> items,
        @NotNull String paymentMethod,
        BigDecimal tendered
) {
}
