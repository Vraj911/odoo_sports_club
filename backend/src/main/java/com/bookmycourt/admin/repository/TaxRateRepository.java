package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {
    Optional<TaxRate> findByName(String name);
    List<TaxRate> findByActiveTrue();
}
