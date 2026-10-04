package com.bookmycourt.shop.event;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * SHP-13 / BKG-14 style: a paid order was cancelled or goods were returned. The payment/billing module
 * should issue the gateway or cash refund and a credit note (FIN-05) for `amount`.
 */
public record ShopRefundRequested(UUID orderId, String orderNumber, UUID memberId, BigDecimal amount, String reason) {
}
