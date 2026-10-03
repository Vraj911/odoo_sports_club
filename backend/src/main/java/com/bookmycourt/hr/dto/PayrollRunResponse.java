package com.bookmycourt.hr.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PayrollRunResponse(
        UUID id,
        String month,
        String status,
        BigDecimal totalGross,
        BigDecimal totalDeductions,
        BigDecimal totalNet,
        OffsetDateTime finalisedAt,
        int employeeCount
) {
}
