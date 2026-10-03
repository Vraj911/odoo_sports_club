package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BarOrderLineResponse(
        UUID id,
        UUID menuItemId,
        String itemName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal taxRate,
        BigDecimal lineTotal,
        String kitchenStatus
) {
}
