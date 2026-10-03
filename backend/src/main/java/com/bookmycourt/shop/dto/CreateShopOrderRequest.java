package com.bookmycourt.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateShopOrderRequest(
        UUID memberId,
        String guestName,
        String guestPhone,
        @NotNull String fulfillmentMethod,
        String deliveryAddress,
        @NotEmpty List<@Valid ShopOrderLineRequest> items
) {
}
