package com.bookmycourt.pricing.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record QuoteRequest(
        @NotNull UUID courtId,
        UUID memberId,
        @NotNull LocalDate date,
        @NotNull String startTime
) {
}
