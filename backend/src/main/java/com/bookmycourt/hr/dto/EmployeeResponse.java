package com.bookmycourt.hr.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        UUID userId,
        String employeeNumber,
        String fullName,
        String email,
        String phone,
        String department,
        String jobTitle,
        LocalDate joiningDate,
        String employmentStatus,
        String salaryStructure,
        Instant createdAt
) {
}
