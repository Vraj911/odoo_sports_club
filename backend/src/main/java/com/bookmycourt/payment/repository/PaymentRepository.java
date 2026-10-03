package com.bookmycourt.payment.repository;

import com.bookmycourt.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByMember_IdOrderByCreatedAtDesc(UUID memberId);

    List<Payment> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);

    List<Payment> findByOrderByCreatedAtDesc();
}
