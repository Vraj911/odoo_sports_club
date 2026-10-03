package com.bookmycourt.crm.dto;

import java.time.Instant;
import java.util.UUID;

public record LeadResponse(
        UUID id,
        String leadNumber,
        UUID memberId,
        String memberName,
        UUID assignedToUserId,
        String assignedToName,
        String firstName,
        String lastName,
        String email,
        String phone,
        String source,
        String status,
        String notes,
        Instant convertedAt,
        String lostReason,
        Instant lastContactAt,
        Instant nextFollowUpAt,
        Instant createdAt
) {
}
