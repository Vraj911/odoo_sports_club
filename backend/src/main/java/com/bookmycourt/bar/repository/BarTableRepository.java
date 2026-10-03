package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BarTableRepository extends JpaRepository<BarTable, UUID> {
    Optional<BarTable> findByTableNumber(String tableNumber);
    List<BarTable> findByStatus(String status);
}
