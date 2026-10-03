package com.bookmycourt.finance.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.finance.entity.Invoice;
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
    public void ensureInvoiceIssued(Invoice invoice) {
        if (invoice == null || invoice.getId() == null) {
            return;
        }
        var existing = txRepo.findByRefTypeAndRefIdAndKind("INVOICE", invoice.getId(), "INVOICE_ISSUED");
        if (existing.isPresent()) {
            return;
        }

        LedgerTransaction tx = new LedgerTransaction();
        tx.setKind("INVOICE_ISSUED");
        tx.setRefType("INVOICE");
        tx.setRefId(invoice.getId());
        tx.setOccurredAt(OffsetDateTime.now());
        tx.setDescription("Invoice issued: " + invoice.getInvoiceNumber());
        tx.setSimulated(false);
        tx.setCreatedBy(invoice.getCreatedBy());

        LedgerEntry debit = new LedgerEntry();
        debit.setTransaction(tx);
        debit.setAccount("1200-ACCOUNTS_RECEIVABLE");
        debit.setSide("DEBIT");
        debit.setAmount(invoice.getTotal());
        debit.setMember(invoice.getMember());
        debit.setSource("INVOICE");
        debit.setMethod("ACCRUAL");

        LedgerEntry credit = new LedgerEntry();
        credit.setTransaction(tx);
        credit.setAccount("4010-REVENUE");
        credit.setSide("CREDIT");
        credit.setAmount(invoice.getTotal());
        credit.setMember(invoice.getMember());
        credit.setSource("INVOICE");
        credit.setMethod("ACCRUAL");

        List<LedgerEntry> entries = new ArrayList<>();
        entries.add(debit);
        entries.add(credit);
        tx.setEntries(entries);

        txRepo.save(tx);
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
        String creditAccount = ("INVOICE".equalsIgnoreCase(refType) || "INVOICE_PAYMENT".equalsIgnoreCase(refType))
                ? "1200-ACCOUNTS_RECEIVABLE" : "4010-REVENUE";

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

    @Transactional
    public void postPayrollAccrual(UUID runId, String month, BigDecimal gross, BigDecimal deductions, BigDecimal net) {
        if (runId == null) {
            return;
        }
        var existing = txRepo.findByRefTypeAndRefIdAndKind("PAYROLL_RUN", runId, "PAYROLL_ACCRUAL");
        if (existing.isPresent()) {
            return;
        }

        LedgerTransaction tx = new LedgerTransaction();
        tx.setKind("PAYROLL_ACCRUAL");
        tx.setRefType("PAYROLL_RUN");
        tx.setRefId(runId);
        tx.setOccurredAt(OffsetDateTime.now());
        tx.setDescription("Payroll accrual for " + month);
        tx.setSimulated(false);

        List<LedgerEntry> entries = new ArrayList<>();
        if (gross != null && gross.compareTo(BigDecimal.ZERO) > 0) {
            LedgerEntry debitGross = new LedgerEntry();
            debitGross.setTransaction(tx);
            debitGross.setAccount("5010-SALARY_EXPENSE");
            debitGross.setSide("DEBIT");
            debitGross.setAmount(gross);
            debitGross.setSource("PAYROLL");
            debitGross.setMethod("ACCRUAL");
            entries.add(debitGross);
        }

        if (deductions != null && deductions.compareTo(BigDecimal.ZERO) > 0) {
            LedgerEntry creditDeductions = new LedgerEntry();
            creditDeductions.setTransaction(tx);
            creditDeductions.setAccount("2030-PAYROLL_DEDUCTIONS_PAYABLE");
            creditDeductions.setSide("CREDIT");
            creditDeductions.setAmount(deductions);
            creditDeductions.setSource("PAYROLL");
            creditDeductions.setMethod("ACCRUAL");
            entries.add(creditDeductions);
        }

        if (net != null && net.compareTo(BigDecimal.ZERO) > 0) {
            LedgerEntry creditNet = new LedgerEntry();
            creditNet.setTransaction(tx);
            creditNet.setAccount("2020-SALARIES_PAYABLE");
            creditNet.setSide("CREDIT");
            creditNet.setAmount(net);
            creditNet.setSource("PAYROLL");
            creditNet.setMethod("ACCRUAL");
            entries.add(creditNet);
        }

        tx.setEntries(entries);
        txRepo.save(tx);
    }

    @Transactional
    public void postSalaryPayout(UUID payslipId, String description, String method, BigDecimal amount) {
        if (payslipId == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        var existing = txRepo.findByRefTypeAndRefIdAndKind("PAYSLIP", payslipId, "SALARY_PAYOUT");
        if (existing.isPresent()) {
            return;
        }

        LedgerTransaction tx = new LedgerTransaction();
        tx.setKind("SALARY_PAYOUT");
        tx.setRefType("PAYSLIP");
        tx.setRefId(payslipId);
        tx.setOccurredAt(OffsetDateTime.now());
        tx.setDescription(description);
        tx.setSimulated(false);

        String creditAccount = "CASH".equalsIgnoreCase(method) ? "1010-CASH" : "1020-BANK";

        LedgerEntry debit = new LedgerEntry();
        debit.setTransaction(tx);
        debit.setAccount("2020-SALARIES_PAYABLE");
        debit.setSide("DEBIT");
        debit.setAmount(amount);
        debit.setSource("PAYSLIP");
        debit.setMethod(method);

        LedgerEntry credit = new LedgerEntry();
        credit.setTransaction(tx);
        credit.setAccount(creditAccount);
        credit.setSide("CREDIT");
        credit.setAmount(amount);
        credit.setSource("PAYSLIP");
        credit.setMethod(method);

        List<LedgerEntry> entries = new ArrayList<>();
        entries.add(debit);
        entries.add(credit);
        tx.setEntries(entries);

        txRepo.save(tx);
    }
}
