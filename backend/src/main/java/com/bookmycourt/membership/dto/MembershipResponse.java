package com.bookmycourt.membership.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MembershipResponse(
        UUID id,
        UUID memberId,
        String memberName,
        String memberCode,
        UUID planId,
        String planName,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        BigDecimal pricePaid,
        UUID previousMembershipId,
        String suspensionReason,
        String cancellationReason,
        Instant createdAt
) {
}
