package com.bookmycourt.shop.repository;

import com.bookmycourt.shop.entity.ShopOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, UUID>, JpaSpecificationExecutor<ShopOrder> {
    Optional<ShopOrder> findByOrderNumber(String orderNumber);
    List<ShopOrder> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<ShopOrder> findByOrderByCreatedAtDesc();

    Optional<ShopOrder> findByIdempotencyKey(String idempotencyKey);

    List<ShopOrder> findByStatusAndChannelAndCreatedAtBefore(String status, String channel, Instant before);

    List<ShopOrder> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);

    long countByStatusIn(Collection<String> statuses);

    /** Two staff acting on the same order (pay / pack / cancel) are serialised. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from ShopOrder o where o.id = :id")
    Optional<ShopOrder> findByIdForUpdate(@Param("id") UUID id);

    /** Collision-free order numbers (was "ORD-" + currentTimeMillis). */
    @Query(value = "select nextval('shop_order_no_seq')", nativeQuery = true)
    long nextOrderNo();

    @Override
    @EntityGraph(attributePaths = "member")
    Page<ShopOrder> findAll(Specification<ShopOrder> spec, Pageable pageable);
}