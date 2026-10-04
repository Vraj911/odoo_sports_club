package com.bookmycourt.shop.dto;

import jakarta.validation.constraints.NotBlank;

/** verificationNumber (optional): scan / type the order number at pickup to confirm it is the right order (SHP-12). */
public record UpdateShopOrderStatusRequest(
        @NotBlank String status,
        String verificationNumber
) {
}