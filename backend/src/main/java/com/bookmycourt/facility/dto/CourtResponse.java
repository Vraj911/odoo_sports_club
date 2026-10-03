package com.bookmycourt.facility.dto;

import java.util.UUID;

public record CourtResponse(
        UUID id,
        String name,
        String sport,
        boolean indoor,
        String location,
        int slotDurationMinutes,
        int slotIntervalMinutes,
        boolean active
) {
}
