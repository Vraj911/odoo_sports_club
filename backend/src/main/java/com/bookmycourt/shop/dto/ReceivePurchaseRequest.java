package com.bookmycourt.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** Receive goods (stock-in) against a PO - full or partial. */
public record ReceivePurchaseRequest(
        @Size(max = 100) String supplierInvoiceNo,
        @NotEmpty List<@Valid Line> lines
) {
    public record Line(@NotNull UUID lineId, @NotNull @Min(1) Integer quantity) {
    }
}
