package com.bookmycourt.shop.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id,
        String poNumber,
        UUID supplierId,
        String supplierName,
        String status,
        String notes,
        String supplierInvoiceNo,
        BigDecimal orderedValue,
        BigDecimal receivedValue,
        List<Line> lines,
        Instant createdAt
) {
    public record Line(UUID id, UUID productVariantId, String productName, String variantName, String sku,
                       int orderedQuantity, int receivedQuantity, BigDecimal unitCost) {
    }
}
