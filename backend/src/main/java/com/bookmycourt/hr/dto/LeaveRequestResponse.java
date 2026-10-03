package com.bookmycourt.hr.dto;

import java.time.LocalDate;
import java.util.UUID;

public record LeaveRequestResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        UUID leaveTypeId,
        String leaveTypeName,
        LocalDate fromDate,
        LocalDate toDate,
        int days,
        String status,
        String reason,
        UUID approvedBy
) {
}
