package com.bookmycourt.payment.repository;

import com.bookmycourt.payment.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {
    List<Refund> findByPayment_IdOrderByCreatedAtDesc(UUID paymentId);
    List<Refund> findByStatusOrderByCreatedAtDesc(String status);
}
