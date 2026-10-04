package com.bookmycourt.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * PICKUP or DELIVERY (SHP-09). DELIVERY needs deliveryAddress; a guest (no memberId) needs name + phone (SHP-08).
 * idempotencyKey: resend the same key after a timeout and you get the same order back, never a duplicate.
 */
public record CreateShopOrderRequest(
        UUID memberId,
        @Size(max = 150) String guestName,
        @Size(max = 20) String guestPhone,
        @NotNull @Pattern(regexp = "(?i)PICKUP|DELIVERY", message = "fulfillmentMethod must be PICKUP or DELIVERY") String fulfillmentMethod,
        @Size(max = 500) String deliveryAddress,
        @Size(max = 255) String deliveryNote,           // delivery slot or note
        @Size(max = 100) String idempotencyKey,
        @NotEmpty List<@Valid ShopOrderLineRequest> items
) {
}