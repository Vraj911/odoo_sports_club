package com.bookmycourt.shop.event;

import java.util.UUID;

/** SHP-11: "the member is notified at each change" - the notification module listens to this. */
public record ShopOrderStatusChanged(UUID orderId, String orderNumber, UUID memberId, String status) {
}
