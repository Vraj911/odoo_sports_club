package com.bookmycourt.admin.dto;

import com.bookmycourt.admin.entity.TaxItemType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TaxRateResponse(
        UUID id,
        String name,
        TaxItemType itemType,
        String hsnCode,
        BigDecimal rate,
        boolean taxInclusive,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        boolean active
) {
}