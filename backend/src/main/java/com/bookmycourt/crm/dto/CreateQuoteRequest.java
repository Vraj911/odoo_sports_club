package com.bookmycourt.crm.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateQuoteRequest(
        @NotNull UUID leadId,
        @NotNull LocalDate validUntil,
        String notes,
        @NotEmpty List<QuoteLineRequest> lines
) {
}
