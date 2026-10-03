package com.bookmycourt.admin.dto;

import java.util.List;

public record ClubPublicResponse(
        String clubName,
        String timezone,
        String currency,
        String openTime,
        String closeTime,
        int dailyCap,
        int holdMinutes,
        String phone,
        String email,
        String address,
        String website,
        String logoUrl,
        List<OpeningHoursResponse> openingHours
) {
}
