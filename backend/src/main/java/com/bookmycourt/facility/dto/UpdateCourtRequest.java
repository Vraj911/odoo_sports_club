package com.bookmycourt.facility.dto;

public record UpdateCourtRequest(
        String name,
        String sport,
        String indoorOutdoor,
        String location,
        Integer slotDurationMinutes,
        Integer slotIntervalMinutes,
        Boolean active
) {
}
