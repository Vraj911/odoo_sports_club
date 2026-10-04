package com.bookmycourt.shop.event;

import java.math.BigDecimal;
import java.util.UUID;

/** SHP-14: goods received against a PO - the finance module records the supplier bill (FIN-10 payables). */
public record PurchaseReceived(UUID purchaseOrderId, String poNumber, UUID supplierId, String supplierName,
                               BigDecimal amount, String supplierInvoiceNo) {
}
