package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BarOrderRepository extends JpaRepository<BarOrder, UUID> {
    Optional<BarOrder> findByOrderNumber(String orderNumber);
    List<BarOrder> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<BarOrder> findByStatusIn(List<String> statuses);
    List<BarOrder> findByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(b.total), 0) FROM BarOrder b WHERE b.status = 'PAID' AND b.createdAt >= :from AND b.createdAt < :to")
    BigDecimal sumPaidBetween(@Param("from") Instant from, @Param("to") Instant to);
}
