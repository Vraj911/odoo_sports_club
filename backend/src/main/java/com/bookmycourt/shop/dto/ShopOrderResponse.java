package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ShopOrderResponse(
        UUID id,
        String orderNumber,
        UUID memberId,
        String memberName,
        String guestName,
        String guestPhone,
        String fulfillmentMethod,
        String deliveryAddress,
        String status,
        BigDecimal subtotal,
        BigDecimal discountTotal,
        BigDecimal taxTotal,
        BigDecimal total,
        List<ShopOrderLineResponse> items,
        Instant createdAt
) {
}
