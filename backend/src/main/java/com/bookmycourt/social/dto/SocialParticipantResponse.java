package com.bookmycourt.social.dto;

import java.time.Instant;
import java.util.UUID;

public record SocialParticipantResponse(
        UUID id,
        UUID sessionId,
        UUID memberId,
        String memberName,
        String guestName,
        String status,
        Instant joinedAt
) {
}
