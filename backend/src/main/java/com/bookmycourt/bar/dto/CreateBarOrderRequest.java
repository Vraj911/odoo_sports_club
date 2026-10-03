package com.bookmycourt.bar.dto;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

public record CreateBarOrderRequest(
        UUID tableId,
        UUID memberId,
        String guestName,
        UUID openedByUserId,
        List<@Valid BarOrderLineRequest> items
) {
}
