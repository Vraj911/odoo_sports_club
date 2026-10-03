package com.bookmycourt.payment.repository;

import com.bookmycourt.payment.entity.PaymentDue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentDueRepository extends JpaRepository<PaymentDue, UUID> {
    List<PaymentDue> findByMember_IdAndStatus(UUID memberId, String status);
    List<PaymentDue> findByStatus(String status);
    List<PaymentDue> findByMember_Id(UUID memberId);
    List<PaymentDue> findByMember_IdOrderByDueSinceDesc(UUID memberId);
    List<PaymentDue> findByMember_IdAndStatusOrderByDueSinceDesc(UUID memberId, String status);
    List<PaymentDue> findByStatusOrderByDueSinceDesc(String status);
    long countByMember_IdAndStatus(UUID memberId, String status);
    Optional<PaymentDue> findByRefTypeAndRefIdAndStatus(String refType, UUID refId, String status);
    List<PaymentDue> findByRefTypeAndRefId(String refType, UUID refId);
    List<PaymentDue> findByStatusAndDueSinceBefore(String status, OffsetDateTime before);
}
