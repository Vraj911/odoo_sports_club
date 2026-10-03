package com.bookmycourt.admin.dto;

public record ClubPublicResponse(
        String clubName,
        String timezone,
        String currency,
        String openTime,
        String closeTime,
        int dailyCap,
        int holdMinutes
) {
}
