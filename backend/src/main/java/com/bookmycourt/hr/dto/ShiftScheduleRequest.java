package com.bookmycourt.hr.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ShiftScheduleRequest(
        @NotNull UUID employeeId,
        @NotNull LocalDate shiftDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        String roleAssigned
) {
}
