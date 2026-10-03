package com.bookmycourt.bar.dto;

import java.time.Instant;
import java.util.UUID;

public record BarTableResponse(
        UUID id,
        String tableNumber,
        Integer capacity,
        String status,
        Instant createdAt
) {
}
