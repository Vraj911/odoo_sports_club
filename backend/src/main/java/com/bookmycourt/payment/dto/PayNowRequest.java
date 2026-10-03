package com.bookmycourt.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PayNowRequest(
        @NotBlank String sourceType,
        @NotNull UUID sourceId,
        UUID memberId
) {
}
