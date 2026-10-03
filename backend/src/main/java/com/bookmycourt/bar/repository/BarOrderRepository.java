package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BarOrderRepository extends JpaRepository<BarOrder, UUID> {
    Optional<BarOrder> findByOrderNumber(String orderNumber);
    List<BarOrder> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<BarOrder> findByStatusIn(List<String> statuses);
    List<BarOrder> findByOrderByCreatedAtDesc();

    /** Unbounded findAll-style listing was a performance trap on a busy bar. */
    List<BarOrder> findTop200ByOrderByCreatedAtDesc();

    /** Row lock: two staff editing / paying the same order are serialised (BAR-03, NFR-01). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from BarOrder o where o.id = :id")
    Optional<BarOrder> findByIdForUpdate(@Param("id") UUID id);

    /** Collision-free order/bill numbers (was "BAR-" + currentTimeMillis). */
    @Query(value = "select nextval('bar_order_no_seq')", nativeQuery = true)
    long nextOrderNo();

    boolean existsByTable_IdAndStatusIn(UUID tableId, Collection<String> statuses);

    boolean existsByTab_IdAndStatusIn(UUID tabId, Collection<String> statuses);

    List<BarOrder> findByTab_IdOrderByCreatedAtAsc(UUID tabId);

    List<BarOrder> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);
}