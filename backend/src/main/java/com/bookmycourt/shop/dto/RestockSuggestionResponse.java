package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RestockSuggestionResponse(
        UUID variantId,
        String productName,
        String variantName,
        String sku,
        int onHand,
        int reserved,
        int available,
        int reorderLevel,
        int suggestedRestockQuantity,
        BigDecimal unitPrice
) {
}
