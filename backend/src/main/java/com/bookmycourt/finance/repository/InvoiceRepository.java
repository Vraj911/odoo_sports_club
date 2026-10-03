package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByMember_IdOrderByCreatedAtDesc(UUID memberId);
    List<Invoice> findByStatus(String status);
    List<Invoice> findByOrderByCreatedAtDesc();
}
