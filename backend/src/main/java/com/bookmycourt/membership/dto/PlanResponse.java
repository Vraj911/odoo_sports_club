package com.bookmycourt.membership.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PlanResponse(
        UUID id,
        String name,
        String description,
        int validityDays,
        int advanceBookingDays,
        int maxBookingsPerDay,
        BigDecimal price
) {
}
