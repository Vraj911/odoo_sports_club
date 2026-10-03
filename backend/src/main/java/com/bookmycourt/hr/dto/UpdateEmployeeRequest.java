package com.bookmycourt.hr.dto;

public record UpdateEmployeeRequest(
        String department,
        String jobTitle,
        String employmentStatus,
        String salaryStructure
) {
}
