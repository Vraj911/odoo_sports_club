package com.bookmycourt.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TaxRateResponse(
        UUID id,
        String name,
        BigDecimal rate,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        boolean active
) {
}
