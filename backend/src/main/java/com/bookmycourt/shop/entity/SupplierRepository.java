package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    boolean existsByNameIgnoreCase(String name);

    List<Supplier> findByActiveTrueOrderByNameAsc();
}
