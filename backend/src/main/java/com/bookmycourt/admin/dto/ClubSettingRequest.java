package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record ClubSettingRequest(
        @NotBlank String settingKey,
        String settingValue,
        String description,
        UUID updatedByUserId
) {
}
