package com.bookmycourt.crm.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateLeadStatusRequest(
        @NotBlank String status,
        String lostReason,
        String notes
) {
}
