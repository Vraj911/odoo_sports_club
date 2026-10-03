package com.bookmycourt.facility.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCourtRequest(
        @NotBlank String name,
        @NotBlank String sport,
        String indoorOutdoor,
        String location,
        Integer slotDurationMinutes,
        Integer slotIntervalMinutes
) {
}
