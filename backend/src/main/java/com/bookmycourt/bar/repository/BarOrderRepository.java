package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BarOrderRepository extends JpaRepository<BarOrder, UUID> {
    Optional<BarOrder> findByOrderNumber(String orderNumber);
    List<BarOrder> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<BarOrder> findByStatusIn(List<String> statuses);
    List<BarOrder> findByOrderByCreatedAtDesc();
}
