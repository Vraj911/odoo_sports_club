package com.bookmycourt.finance.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateInvoiceStatusRequest(
        @NotBlank String status
) {
}
