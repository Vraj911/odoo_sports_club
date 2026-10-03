package com.bookmycourt.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID courtId,
        String courtName,
        String sport,
        boolean indoor,
        LocalDate date,
        String startTime,
        String endTime,
        String status,
        BigDecimal price,
        String memberName,
        UUID memberId,
        String guestName,
        String guestPhone,
        String paymentStatus,
        Instant createdAt,
        Instant holdExpiry,
        String notes
) {
}
