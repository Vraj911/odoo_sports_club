package com.bookmycourt.hr.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AttendanceResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String employeeNumber,
        LocalDate attendanceDate,
        Instant checkInAt,
        Instant checkOutAt,
        String status,
        String source,
        String notes,
        String approvedByName,
        Instant createdAt
) {
}
