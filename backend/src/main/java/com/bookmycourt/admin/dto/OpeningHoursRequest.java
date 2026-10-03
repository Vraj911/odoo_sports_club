package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/** weekday: 1 = Monday .. 7 = Sunday (ISO-8601). Times must be on 30-minute boundaries. */
public record OpeningHoursRequest(
        @NotNull @Min(1) @Max(7) Short weekday,
        LocalTime openTime,
        LocalTime closeTime,
        @NotNull Boolean closed
) {
}
