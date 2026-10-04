package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.StockMovement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    List<StockMovement> findByProductVariant_IdOrderByCreatedAtDesc(UUID variantId);
    List<StockMovement> findByOrderByCreatedAtDesc();

    List<StockMovement> findTop200ByOrderByCreatedAtDesc();

    List<StockMovement> findTop200ByProductVariant_IdOrderByCreatedAtDesc(UUID variantId);

    /** Best sellers over a window: rows of [variantId, unitsSold]. */
    @Query("""
            select m.productVariant.id, sum(m.quantity) from StockMovement m
            where m.movementType = 'SALE' and m.createdAt >= :since
            group by m.productVariant.id
            order by sum(m.quantity) desc
            """)
    List<Object[]> topSellers(@Param("since") Instant since, Pageable pageable);
}