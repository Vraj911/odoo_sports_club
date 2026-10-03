package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record AuditLogRequest(
        UUID actorUserId,
        @NotBlank String action,
        @NotBlank String entityType,
        UUID entityId,
        String userAgent,
        String details
) {
}
