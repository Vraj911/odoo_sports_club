package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BarOrderLineRepository extends JpaRepository<BarOrderLine, UUID> {
    List<BarOrderLine> findByBarOrder_Id(UUID barOrderId);
    List<BarOrderLine> findByKitchenStatusIn(List<String> statuses);
}
