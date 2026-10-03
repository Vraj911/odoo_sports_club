package com.bookmycourt.finance.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.finance.entity.LedgerEntry;
import com.bookmycourt.finance.entity.LedgerTransaction;
import com.bookmycourt.finance.repository.LedgerEntryRepository;
import com.bookmycourt.finance.repository.LedgerTransactionRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LedgerService {

    private final LedgerTransactionRepository txRepo;
    private final LedgerEntryRepository entryRepo;

    public LedgerService(LedgerTransactionRepository txRepo, LedgerEntryRepository entryRepo) {
        this.txRepo = txRepo;
        this.entryRepo = entryRepo;
    }

    @Transactional
    public LedgerTransaction postPayment(
            String refType,
            UUID refId,
            String kind,
            String description,
            Member member,
            String source,
            String method,
            BigDecimal amount,
            boolean simulated,
            AppUser createdBy) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Ledger entry amount must be positive");
        }

        // Check if transaction already exists for idempotency
        var existing = txRepo.findByRefTypeAndRefIdAndKind(refType, refId, kind);
        if (existing.isPresent()) {
            return existing.get();
        }

        LedgerTransaction tx = new LedgerTransaction();
        tx.setKind(kind);
        tx.setRefType(refType);
        tx.setRefId(refId);
        tx.setOccurredAt(OffsetDateTime.now());
        tx.setDescription(description);
        tx.setSimulated(simulated);
        tx.setCreatedBy(createdBy);

        String debitAccount = "CASH".equalsIgnoreCase(method) ? "1010-CASH" : "1020-BANK";
        String creditAccount = "INVOICE".equalsIgnoreCase(refType) ? "1200-ACCOUNTS_RECEIVABLE" : "4010-REVENUE";

        LedgerEntry debit = new LedgerEntry();
        debit.setTransaction(tx);
        debit.setAccount(debitAccount);
        debit.setSide("DEBIT");
        debit.setAmount(amount);
        debit.setMember(member);
        debit.setSource(source);
        debit.setMethod(method);

        LedgerEntry credit = new LedgerEntry();
        credit.setTransaction(tx);
        credit.setAccount(creditAccount);
        credit.setSide("CREDIT");
        credit.setAmount(amount);
        credit.setMember(member);
        credit.setSource(source);
        credit.setMethod(method);

        List<LedgerEntry> entries = new ArrayList<>();
        entries.add(debit);
        entries.add(credit);
        tx.setEntries(entries);

        txRepo.save(tx);
        return tx;
    }

    @Transactional
    public LedgerTransaction postReversal(UUID originalTxId, String reason, AppUser createdBy) {
        LedgerTransaction original = txRepo.findById(originalTxId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Original transaction not found: " + originalTxId));

        LedgerTransaction reversal = new LedgerTransaction();
        reversal.setKind("REVERSAL");
        reversal.setRefType(original.getRefType());
        reversal.setRefId(original.getRefId());
        reversal.setOccurredAt(OffsetDateTime.now());
        reversal.setDescription("Reversal: " + reason);
        reversal.setReversalOf(original);
        reversal.setSimulated(original.isSimulated());
        reversal.setCreatedBy(createdBy);

        List<LedgerEntry> entries = new ArrayList<>();
        for (LedgerEntry oldEntry : original.getEntries()) {
            LedgerEntry revEntry = new LedgerEntry();
            revEntry.setTransaction(reversal);
            revEntry.setAccount(oldEntry.getAccount());
            revEntry.setSide("DEBIT".equalsIgnoreCase(oldEntry.getSide()) ? "CREDIT" : "DEBIT");
            revEntry.setAmount(oldEntry.getAmount());
            revEntry.setMember(oldEntry.getMember());
            revEntry.setSource(oldEntry.getSource());
            revEntry.setMethod(oldEntry.getMethod());
            entries.add(revEntry);
        }
        reversal.setEntries(entries);

        txRepo.save(reversal);
        return reversal;
    }
}
