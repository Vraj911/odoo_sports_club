package com.bookmycourt.social.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SocialSessionResponse(
        UUID id,
        UUID courtId,
        String courtName,
        String sport,
        String title,
        Instant startAt,
        Instant endAt,
        int capacity,
        int registeredCount,
        String status,
        String notes,
        List<SocialParticipantResponse> participants,
        Instant createdAt
) {
}
