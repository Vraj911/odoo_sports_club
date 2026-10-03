package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    List<StockMovement> findByProductVariant_IdOrderByCreatedAtDesc(UUID variantId);
    List<StockMovement> findByOrderByCreatedAtDesc();
}
