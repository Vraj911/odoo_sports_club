package com.bookmycourt.payment.repository;

import com.bookmycourt.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByMember_IdOrderByCreatedAtDesc(UUID memberId);

    List<Payment> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);

    List<Payment> findByOrderByCreatedAtDesc();

    boolean existsByInvoiceIdAndReference(UUID invoiceId, String reference);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID'")
    BigDecimal sumPaid();

    @Query("SELECT p.sourceType, p.method, COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID' AND p.paidAt >= :from AND p.paidAt < :to GROUP BY p.sourceType, p.method")
    List<Object[]> revenueBreakdown(@Param("from") Instant from, @Param("to") Instant to);
}
