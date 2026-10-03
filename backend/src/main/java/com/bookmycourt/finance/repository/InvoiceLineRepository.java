package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.InvoiceLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoiceLineRepository extends JpaRepository<InvoiceLine, UUID> {
    List<InvoiceLine> findByInvoice_Id(UUID invoiceId);
}
