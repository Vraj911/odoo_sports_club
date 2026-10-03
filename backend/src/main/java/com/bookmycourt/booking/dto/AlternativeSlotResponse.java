package com.bookmycourt.booking.dto;
import java.time.LocalDate;
import java.util.UUID;
public record AlternativeSlotResponse(
        UUID courtId,
        String courtName,
        String time,
        LocalDate date
) {
}
