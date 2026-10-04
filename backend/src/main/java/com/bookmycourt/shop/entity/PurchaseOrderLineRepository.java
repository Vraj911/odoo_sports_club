package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.PurchaseOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PurchaseOrderLineRepository extends JpaRepository<PurchaseOrderLine, UUID> {

    /** Units still expected from open POs: rows of [variantId, unitsOnOrder]. */
    @Query("""
            select l.productVariant.id, sum(l.orderedQuantity - l.receivedQuantity)
            from PurchaseOrderLine l
            where l.purchaseOrder.status in ('ORDERED', 'PARTIALLY_RECEIVED')
            group by l.productVariant.id
            """)
    List<Object[]> onOrderByVariant();
}
