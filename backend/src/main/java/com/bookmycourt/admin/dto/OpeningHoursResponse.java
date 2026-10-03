package com.bookmycourt.admin.dto;

import java.time.LocalTime;

public record OpeningHoursResponse(
        short weekday,
        String dayName,
        LocalTime openTime,
        LocalTime closeTime,
        boolean closed
) {
}
