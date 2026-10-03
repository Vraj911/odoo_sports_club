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
        String channel,
        String paymentPolicy,
        Boolean overrideCap,
        String overrideReason,
        String source
) {
    public CreateBookingRequest(
            UUID courtId,
            UUID memberId,
            String guestName,
            String guestPhone,
            LocalDate date,
            String startTime,
            String channel
    ) {
        this(courtId, memberId, guestName, guestPhone, date, startTime, channel, "PAY_NOW", false, null, "DIRECT");
    }

    public boolean isOverrideCap() {
        return Boolean.TRUE.equals(overrideCap);
    }
}
