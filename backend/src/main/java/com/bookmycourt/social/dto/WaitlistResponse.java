package com.bookmycourt.social.dto;

import java.time.Instant;
import java.util.UUID;

public record WaitlistResponse(
        UUID id,
        UUID sessionId,
        UUID courtId,
        UUID memberId,
        String memberName,
        String guestName,
        Instant requestedStartAt,
        Instant requestedEndAt,
        int position,
        String status,
        Instant createdAt
) {
}
