package com.bookmycourt.hr.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record ApplyLeaveRequest(
        @NotNull UUID employeeId,
        @NotNull UUID leaveTypeId,
        @NotNull LocalDate fromDate,
        @NotNull LocalDate toDate,
        int days,
        String reason
) {
}
