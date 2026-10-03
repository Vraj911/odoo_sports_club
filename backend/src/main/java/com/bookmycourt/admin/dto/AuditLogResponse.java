package com.bookmycourt.admin.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorUserId,
        String actorName,
        String action,
        String entityType,
        UUID entityId,
        Instant occurredAt,
        String userAgent,
        String reason,
        Map<String, Object> beforeValue,
        Map<String, Object> afterValue,
        Map<String, Object> details
) {
}