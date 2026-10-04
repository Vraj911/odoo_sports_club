package com.bookmycourt.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** SHP-14: create a PO for low-stock items (prefill from GET /inventory/restock-suggestions). */
public record PurchaseOrderRequest(
        @NotNull UUID supplierId,
        @Size(max = 500) String notes,
        @NotEmpty List<@Valid Line> lines
) {
    public record Line(@NotNull UUID productVariantId, @NotNull @Min(1) Integer quantity,
                       @NotNull @DecimalMin("0.0") BigDecimal unitCost) {
    }
}
