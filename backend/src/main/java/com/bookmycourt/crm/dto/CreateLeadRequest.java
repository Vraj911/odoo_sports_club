package com.bookmycourt.crm.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateLeadRequest(
        @NotBlank String firstName,
        String lastName,
        String email,
        String phone,
        @NotBlank String source,
        String notes,
        UUID assignedToUserId
) {
}
