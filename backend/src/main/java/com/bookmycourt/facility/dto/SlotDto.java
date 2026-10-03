package com.bookmycourt.facility.dto;

import java.time.LocalTime;

public record SlotDto(
        int slotIndex,
        LocalTime startTime,
        LocalTime endTime,
        String status, // FREE, BOOKED, HELD, SOCIAL, BLOCKED
        boolean startable
) {
}
