package com.bookmycourt.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record CreateFollowUpRequest(
        @NotNull UUID leadId,
        @NotNull Instant dueAt,
        @NotBlank String subject,
        String notes,
        UUID assignedToUserId
) {
}
