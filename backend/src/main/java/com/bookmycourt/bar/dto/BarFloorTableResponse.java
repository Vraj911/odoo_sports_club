package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BarFloorTableResponse(
        UUID tableId,
        String tableNumber,
        int capacity,
        String status,
        UUID activeOrderId,
        String activeOrderNumber,
        BigDecimal orderTotal,
        Instant orderOpenedAt,
        int unservedItemCount
) {
}
