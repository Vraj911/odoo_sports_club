package com.bookmycourt.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SendNotificationRequest(
        @NotNull UUID userId,
        @NotBlank String notificationType,
        @NotBlank String title,
        @NotBlank String message,
        String entityType,
        UUID entityId,
        List<String> channels
) {
}
