package com.bookmycourt.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        String expenseNumber,
        String expenseType,
        String description,
        BigDecimal amount,
        String paymentMethod,
        Instant incurredAt,
        String recordedByName,
        String notes,
        Instant createdAt
        ) {

}
