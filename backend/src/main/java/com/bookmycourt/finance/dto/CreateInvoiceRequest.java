package com.bookmycourt.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateInvoiceRequest(
        UUID memberId,
        LocalDate dueDate,
        String notes,
        UUID createdByUserId,
        @NotEmpty List<@Valid InvoiceLineRequest> items
) {
}
