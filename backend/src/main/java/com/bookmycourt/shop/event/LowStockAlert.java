package com.bookmycourt.shop.event;

import java.util.UUID;

/**
 * SHP-05 / AC-08: published once when a variant's available stock drops to its reorder level.
 * The notification module should listen and send the in-app + email alert to Shop Staff / Manager (NTF-02).
 */
public record LowStockAlert(UUID variantId, String sku, String productName, String variantName,
                            int available, int reorderLevel) {
}
