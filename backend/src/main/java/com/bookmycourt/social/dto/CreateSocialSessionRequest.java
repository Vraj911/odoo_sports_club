package com.bookmycourt.social.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record CreateSocialSessionRequest(
        @NotNull UUID courtId,
        @NotBlank String title,
        @NotNull Instant startAt,
        @NotNull Instant endAt,
        @NotNull @Min(1) Integer capacity,
        String notes,
        UUID createdByUserId
) {
}
