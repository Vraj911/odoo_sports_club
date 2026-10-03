package com.bookmycourt.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RecordAttendanceRequest(
        @NotNull UUID employeeId,
        @NotNull LocalDate attendanceDate,
        Instant checkInAt,
        Instant checkOutAt,
        @NotBlank String status,
        String source,
        String notes,
        UUID approvedByUserId
) {
}
