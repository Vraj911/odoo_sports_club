package com.bookmycourt.hr.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ShiftScheduleResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        LocalDate shiftDate,
        LocalTime startTime,
        LocalTime endTime,
        String roleAssigned
) {
}
