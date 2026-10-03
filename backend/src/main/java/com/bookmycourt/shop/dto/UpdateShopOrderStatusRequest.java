package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateShopOrderStatusRequest(
        @NotBlank String status
) {
}
