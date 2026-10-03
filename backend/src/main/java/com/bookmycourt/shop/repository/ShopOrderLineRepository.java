package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.ShopOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShopOrderLineRepository extends JpaRepository<ShopOrderLine, UUID> {
    List<ShopOrderLine> findByShopOrder_Id(UUID shopOrderId);
}
