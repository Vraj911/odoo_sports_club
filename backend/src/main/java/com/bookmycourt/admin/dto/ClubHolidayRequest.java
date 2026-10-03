package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ClubHolidayRequest(
        @NotNull LocalDate holidayDate,
        @NotBlank String name,
        Boolean isActive
) {
}
