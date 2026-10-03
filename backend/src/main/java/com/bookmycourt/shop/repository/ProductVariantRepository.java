package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findBySku(String sku);
    List<ProductVariant> findByProduct_IdAndActiveTrue(UUID productId);

    @Query("SELECT pv FROM ProductVariant pv WHERE pv.active = true AND (pv.onHand - pv.reserved) <= pv.reorderLevel")
    List<ProductVariant> findLowStock();
}
