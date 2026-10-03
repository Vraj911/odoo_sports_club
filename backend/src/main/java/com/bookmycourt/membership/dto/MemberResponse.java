package com.bookmycourt.membership.dto;

import java.util.UUID;

public record MemberResponse(
        UUID id,
        UUID userId,
        String memberCode,
        UUID qrToken,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        String planName,
        int maxBookingsPerDay,
        int advanceBookingDays
) {
}
