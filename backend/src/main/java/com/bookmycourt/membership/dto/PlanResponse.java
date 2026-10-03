package com.bookmycourt.membership.dto;

import java.util.UUID;

public record PlanResponse(
        UUID id,
        String name,
        String description,
        int validityDays,
        int advanceBookingDays,
        int maxBookingsPerDay
) {
}
