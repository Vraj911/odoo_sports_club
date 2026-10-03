package com.bookmycourt.pricing.repository;

import com.bookmycourt.pricing.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface PricingRuleRepository extends JpaRepository<PricingRule, UUID> {

    @Query("""
            SELECT r FROM PricingRule r
            WHERE r.active = true
              AND r.customerType = :customerType
              AND r.dayType = :dayType
              AND (r.plan IS NULL AND :planId IS NULL OR r.plan.id = :planId)
              AND (r.indoorOutdoor IS NULL OR r.indoorOutdoor = :indoorOutdoor)
              AND r.timeStart <= :start
              AND r.timeEnd > :start
              AND r.validFrom <= :onDate
              AND (r.validTo IS NULL OR r.validTo >= :onDate)
            ORDER BY r.indoorOutdoor DESC
            """)
    List<PricingRule> findMatching(
            @Param("planId") UUID planId,
            @Param("customerType") String customerType,
            @Param("dayType") String dayType,
            @Param("indoorOutdoor") String indoorOutdoor,
    List<PricingRule> findByActiveTrue();
}
