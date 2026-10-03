package com.bookmycourt.membership.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MemberScanResponse(
        UUID id,
        String memberCode,
        String name,
        String activePlan,
        Integer daysToExpiry,
        BigDecimal openDuesAmount,
        String nextBooking
) {
}
