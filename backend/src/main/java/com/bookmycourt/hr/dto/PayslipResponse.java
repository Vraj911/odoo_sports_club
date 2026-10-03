package com.bookmycourt.hr.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PayslipResponse(
        UUID id,
        UUID payrollRunId,
        UUID employeeId,
        String employeeName,
        String jobTitle,
        BigDecimal grossSalary,
        BigDecimal deductions,
        BigDecimal netSalary,
        String status
) {
}
