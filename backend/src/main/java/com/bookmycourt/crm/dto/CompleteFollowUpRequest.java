package com.bookmycourt.crm.dto;

import java.util.UUID;

public record CompleteFollowUpRequest(
        UUID completedByUserId,
        String notes
) {
}
