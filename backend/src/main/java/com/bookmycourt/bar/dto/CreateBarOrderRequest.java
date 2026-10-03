package com.bookmycourt.bar.dto;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

/**
 * openedByUserId was removed: the staff member is taken from the authenticated user (BAR-11).
 * Identify a member with GET /members/search or /members/scan/{qrToken} and pass memberId (BAR-05).
 */
public record CreateBarOrderRequest(
        UUID tableId,
        UUID memberId,
        String guestName,
        UUID tabId,
        List<@Valid BarOrderLineRequest> items
) {
}
