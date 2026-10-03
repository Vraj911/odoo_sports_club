package com.bookmycourt.membership.dto;

import jakarta.validation.constraints.NotBlank;

public record MembershipStatusRequest(
        @NotBlank String status,
        String reason
) {
}
