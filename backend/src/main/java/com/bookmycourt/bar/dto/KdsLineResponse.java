package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** BAR-04: table, who ordered what, notes, time elapsed, status. */
public record KdsLineResponse(
        UUID lineId,
        UUID orderId,
        String orderNumber,
        String tableNumber,
        String itemName,
        BigDecimal quantity,
        String notes,
        String orderedBy,
        String station,
        String kitchenStatus,
        Instant sentAt,
        long elapsedSeconds
) {
}
