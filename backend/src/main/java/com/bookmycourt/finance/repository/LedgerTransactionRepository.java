package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, UUID> {
    Optional<LedgerTransaction> findByRefTypeAndRefIdAndKind(String refType, UUID refId, String kind);
}
