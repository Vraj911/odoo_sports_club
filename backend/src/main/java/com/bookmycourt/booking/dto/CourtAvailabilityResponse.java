package com.bookmycourt.booking.dto;

import java.util.List;
import java.util.UUID;

public record CourtAvailabilityResponse(
        UUID courtId,
        String courtName,
        String sport,
        boolean indoor,
        String date,
        List<String> occupiedHalfHours,
        List<String> startableStarts
) {
}
