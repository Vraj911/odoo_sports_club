package com.bookmycourt.social.dto;

import java.time.Instant;
import java.util.UUID;

public record CreateWaitlistRequest(
        UUID sessionId,
        UUID courtId,
        UUID memberId,
        String guestName,
        Instant requestedStartAt,
        Instant requestedEndAt
) {
}
