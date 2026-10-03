package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.NotBlank;

/** updatedBy is NOT accepted from the client any more - it is taken from the authenticated user. */
public record ClubSettingRequest(
        @NotBlank String settingKey,
        String settingValue,
        String description,
        String reason
) {
}