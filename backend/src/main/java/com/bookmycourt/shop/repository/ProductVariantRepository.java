package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySkuIgnoreCase(String sku);

    List<ProductVariant> findByProduct_IdAndActiveTrue(UUID productId);

    @Query("SELECT pv FROM ProductVariant pv WHERE pv.active = true AND (pv.onHand - pv.reserved) <= pv.reorderLevel")
    List<ProductVariant> findLowStock();

    List<ProductVariant> findByIsQuickSaleTrueAndActiveTrue();

    /**
     * Row locks, always in id order (no deadlocks between two orders sharing items).
     * NFR-01 / AC-07: stock never goes negative and the last unit can only be sold once.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from ProductVariant v where v.id in :ids order by v.id")
    List<ProductVariant> findAllForUpdate(@Param("ids") Collection<UUID> ids);

    /** SHP-06: scan a SKU or type part of a name / brand. */
    @Query("""
            select v from ProductVariant v join v.product p
            where v.active = true and p.active = true
              and (lower(v.sku) = lower(:q)
                   or lower(v.variantName) like lower(concat('%', :q, '%'))
                   or lower(p.name) like lower(concat('%', :q, '%'))
                   or lower(coalesce(p.brand, '')) like lower(concat('%', :q, '%')))
            order by p.name, v.variantName
            """)
    List<ProductVariant> search(@Param("q") String q, Pageable pageable);

    /** SHP-16 dead stock: stock on the shelf but no sale since the cut-off. */
    @Query("""
            select v from ProductVariant v
            where v.active = true and v.onHand > 0
              and not exists (select 1 from StockMovement m
                              where m.productVariant = v and m.movementType = 'SALE' and m.createdAt >= :cutoff)
            order by v.onHand desc
            """)
    List<ProductVariant> findDeadStock(@Param("cutoff") Instant cutoff);

    @Query("select count(v) from ProductVariant v where v.active = true and (v.onHand - v.reserved) <= 0")
    long countOutOfStock();

    @Query("select count(v) from ProductVariant v where v.active = true")
    long countActive();
}