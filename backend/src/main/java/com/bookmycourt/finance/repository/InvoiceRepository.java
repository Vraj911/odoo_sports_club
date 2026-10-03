package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.Invoice;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<Invoice> findByStatus(String status);
    List<Invoice> findByOrderByCreatedAtDesc();

    long countByStatusIn(List<String> statuses);

    @Query("SELECT COALESCE(SUM(i.total - i.amountPaid), 0) FROM Invoice i WHERE i.status IN ('SENT', 'PARTIAL', 'OVERDUE') AND i.kind != 'CREDIT_NOTE'")
    BigDecimal outstandingReceivables();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.id = :id")
    Optional<Invoice> findByIdForUpdate(@Param("id") UUID id);

    List<Invoice> findByStatusInAndDueDateBefore(List<String> statuses, LocalDate dueDate);
}
