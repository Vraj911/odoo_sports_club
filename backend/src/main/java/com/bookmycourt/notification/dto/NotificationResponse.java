package com.bookmycourt.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        String notificationType,
        String title,
        String message,
        String entityType,
        UUID entityId,
        boolean isRead,
        Instant createdAt
) {
}
