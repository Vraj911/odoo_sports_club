package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateKitchenStatusRequest(
        @NotBlank String kitchenStatus
) {
}
