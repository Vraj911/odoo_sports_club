package com.bookmycourt.crm.dto;

import java.time.Instant;
import java.util.UUID;

public record FollowUpResponse(
        UUID id,
        UUID leadId,
        String leadName,
        UUID assignedToUserId,
        String assignedToName,
        Instant dueAt,
        String status,
        String subject,
        String notes,
        Instant completedAt,
        String completedByName,
        Instant createdAt
) {
}
