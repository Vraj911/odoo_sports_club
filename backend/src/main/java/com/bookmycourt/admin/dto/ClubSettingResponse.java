package com.bookmycourt.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record ClubSettingResponse(
        UUID id,
        String settingKey,
        String settingValue,
        String description,
        UUID updatedBy,
        Instant updatedAt
) {
}