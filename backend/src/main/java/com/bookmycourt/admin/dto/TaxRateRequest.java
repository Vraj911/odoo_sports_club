package com.bookmycourt.admin.dto;

import com.bookmycourt.admin.entity.TaxItemType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** rate is a PERCENTAGE (18 = 18%). PUT replaces the whole record (effectiveTo = null means open-ended). */
public record TaxRateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull TaxItemType itemType,
        @Pattern(regexp = "^\\d{4,8}$", message = "HSN/SAC must be 4-8 digits") String hsnCode,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") @Digits(integer = 3, fraction = 2) BigDecimal rate,
        Boolean taxInclusive,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Boolean isActive
) {
}