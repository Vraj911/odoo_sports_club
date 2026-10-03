package com.bookmycourt.pricing.service;

import com.bookmycourt.common.money.Money;

import java.util.UUID;

public record PriceQuote(
        Money amount,
        UUID ruleId,
        String breakdown,
        Money guestPrice
) {
}
