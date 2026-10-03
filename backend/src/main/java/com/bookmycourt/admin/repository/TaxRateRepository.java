package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {

    // NOTE: findByName(String) -> Optional was removed: name is no longer unique.
    List<TaxRate> findByNameIgnoreCase(String name);

    List<TaxRate> findByActiveTrue();

    List<TaxRate> findAllByOrderByNameAscEffectiveFromDesc();

    @Query("""
            select t from TaxRate t
            where t.active = true
              and t.effectiveFrom <= :d
              and (t.effectiveTo is null or t.effectiveTo >= :d)
            order by t.itemType, t.name
            """)
    List<TaxRate> findEffectiveOn(@Param("d") LocalDate d);
}