package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    List<LedgerEntry> findByTransaction_Id(UUID transactionId);
    List<LedgerEntry> findByAccount(String account);
}
