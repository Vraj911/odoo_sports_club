package com.bookmycourt.membership.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ChangePlanRequest(
        UUID newPlanId,
        LocalDate effectiveDate
) {
}
