package com.bookmycourt.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
public record CreateBookingRequest(
        @NotNull UUID courtId,
        UUID memberId,
        String guestName,
        String guestPhone,
        @NotNull LocalDate date,
        @NotBlank String startTime,
        String channel
) {
}
