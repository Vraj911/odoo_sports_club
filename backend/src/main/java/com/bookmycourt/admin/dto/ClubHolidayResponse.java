package com.bookmycourt.admin.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ClubHolidayResponse(
        UUID id,
        LocalDate holidayDate,
        String name,
        boolean active,
        boolean closed,
        LocalTime openTime,
        LocalTime closeTime
) {
}
