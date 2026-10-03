package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BarPaymentRepository extends JpaRepository<BarPayment, UUID> {
    List<BarPayment> findByBarOrder_IdOrderByCreatedAtAsc(UUID barOrderId);

    boolean existsByBarOrder_IdAndIdempotencyKey(UUID barOrderId, String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    List<BarPayment> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);

    /** Replaces the old "payments.findAll() and filter in memory" at shift close. */
    @Query("select coalesce(sum(p.amount), 0) from BarPayment p where p.cashShift.id = :shiftId and p.method = 'CASH'")
    BigDecimal sumCashByShift(@Param("shiftId") UUID shiftId);
}
