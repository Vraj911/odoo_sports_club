package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ClubHolidayRequest(
        @NotNull LocalDate holidayDate,
        @NotBlank String name,
        Boolean isActive,
        Boolean closed,
        LocalTime openTime,
        LocalTime closeTime
) {
}
