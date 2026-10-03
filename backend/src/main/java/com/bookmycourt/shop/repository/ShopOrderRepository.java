package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, UUID> {
    Optional<ShopOrder> findByOrderNumber(String orderNumber);
    List<ShopOrder> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<ShopOrder> findByOrderByCreatedAtDesc();
}
