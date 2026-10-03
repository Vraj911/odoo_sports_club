package com.bookmycourt.social.dto;

import java.util.UUID;

public record JoinSocialSessionRequest(
        UUID memberId,
        String guestName,
        String guestPhone
) {
}
