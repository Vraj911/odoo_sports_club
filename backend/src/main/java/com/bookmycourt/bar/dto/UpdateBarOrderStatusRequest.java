package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBarOrderStatusRequest(
        @NotBlank String status
) {
}
