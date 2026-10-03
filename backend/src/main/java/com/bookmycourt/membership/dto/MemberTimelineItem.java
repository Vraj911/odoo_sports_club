package com.bookmycourt.membership.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MemberTimelineItem(
        String type,
        Instant at,
        String title,
        BigDecimal amount,
        UUID refId
) {
}
