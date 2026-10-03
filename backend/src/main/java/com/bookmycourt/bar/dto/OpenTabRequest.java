package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.UUID;

/** A tab belongs to a member or a table/guest. limitAmount is optional (BAR-06). */
public record OpenTabRequest(
        UUID memberId,
        UUID tableId,
        String guestName,
        @DecimalMin("0.00") BigDecimal limitAmount
) {
}
