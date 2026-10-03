package com.bookmycourt.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateEmployeeRequest(
        @NotNull UUID userId,
        String department,
        @NotBlank String jobTitle,
        @NotNull LocalDate joiningDate,
        String salaryStructure
) {
}
