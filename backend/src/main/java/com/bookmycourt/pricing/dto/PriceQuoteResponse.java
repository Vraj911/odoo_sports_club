package com.bookmycourt.pricing.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PriceQuoteResponse(
        BigDecimal guestRate,
        BigDecimal planDiscount,
        String planName,
        UUID ruleId,
        BigDecimal youPay,
        String breakdown
) {
}
