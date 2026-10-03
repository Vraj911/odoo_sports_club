package com.bookmycourt.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record CancelBookingRequest(@NotBlank String reason) {
}
