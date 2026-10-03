package com.bookmycourt.finance.service;

import com.bookmycourt.admin.service.ClubQueryService;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.finance.dto.CreateInvoiceRequest;
import com.bookmycourt.finance.dto.ExpenseRequest;
import com.bookmycourt.finance.dto.ExpenseResponse;
import com.bookmycourt.finance.dto.InvoiceLineRequest;
import com.bookmycourt.finance.dto.InvoiceResponse;
import com.bookmycourt.finance.dto.RecordInvoicePaymentRequest;
import com.bookmycourt.finance.dto.UpdateInvoiceStatusRequest;
import com.bookmycourt.finance.entity.Expense;
import com.bookmycourt.finance.entity.Invoice;
import com.bookmycourt.finance.entity.InvoiceLine;
import com.bookmycourt.finance.mapper.FinanceMapper;
import com.bookmycourt.finance.repository.ExpenseRepository;
import com.bookmycourt.finance.repository.InvoiceRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FinanceService {

    private final InvoiceRepository invoices;
    private final ExpenseRepository expenses;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final PaymentRepository payments;
    private final FinanceMapper mapper;
    private final com.bookmycourt.common.sequence.NumberSeriesService numberSeries;
    private final LedgerService ledgerService;
    private final Clock clock;
    private final ClubQueryService clubQueryService;

    public FinanceService(
            InvoiceRepository invoices,
            ExpenseRepository expenses,
            MemberRepository members,
            AppUserRepository users,
            PaymentRepository payments,
            FinanceMapper mapper,
            com.bookmycourt.common.sequence.NumberSeriesService numberSeries,
            LedgerService ledgerService,
            Clock clock,
            ClubQueryService clubQueryService) {
        this.invoices = invoices;
        this.expenses = expenses;
        this.members = members;
        this.users = users;
        this.payments = payments;
        this.mapper = mapper;
        this.numberSeries = numberSeries;
        this.ledgerService = ledgerService;
        this.clock = clock;
        this.clubQueryService = clubQueryService;
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Member member = null;
        if (request.memberId() != null) {
            member = members.findById(request.memberId())
                    .orElseThrow(() -> new NotFoundException("Member not found"));
        }

        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(numberSeries.nextInvoiceNumber());
        invoice.setMember(member);
        invoice.setStatus("DRAFT");
        invoice.setIssueDate(today);
        invoice.setDueDate(request.dueDate() != null ? request.dueDate() : today.plusDays(15));
        
        String currency = "INR";
        try {
            var profile = clubQueryService.current();
            if (profile != null && profile.currency() != null) {
                currency = profile.currency();
            }
        } catch (Exception ignored) {}
        invoice.setCurrency(currency);
        invoice.setNotes(request.notes());

        if (request.createdByUserId() != null) {
            AppUser u = users.findById(request.createdByUserId()).orElse(null);
            invoice.setCreatedBy(u);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        List<InvoiceLine> lines = new ArrayList<>();
        for (InvoiceLineRequest item : request.items()) {
            BigDecimal qty = item.quantity();
            BigDecimal price = item.unitPrice();
            BigDecimal taxRate = item.taxRate() != null ? item.taxRate() : BigDecimal.ZERO;

            BigDecimal lineSubtotal = qty.multiply(price);
            BigDecimal taxAmount = lineSubtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(taxAmount);

            InvoiceLine line = new InvoiceLine();
            line.setInvoice(invoice);
            line.setDescription(item.description());
            line.setSourceType(item.sourceType());
            line.setSourceId(item.sourceId());
            line.setQuantity(qty);
            line.setUnitPrice(price);
            line.setTaxRate(taxRate);
            line.setTaxAmount(taxAmount);
            line.setLineTotal(lineTotal);
            lines.add(line);

            subtotal = subtotal.add(lineSubtotal);
            taxTotal = taxTotal.add(taxAmount);
        }

        BigDecimal cgst = taxTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = taxTotal.subtract(cgst);
        BigDecimal igst = BigDecimal.ZERO;

        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(taxTotal);
        invoice.setCgst(cgst);
        invoice.setSgst(sgst);
        invoice.setIgst(igst);
        invoice.setTotal(subtotal.add(taxTotal));
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setLines(lines);

        invoices.save(invoice);
        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse updateStatus(UUID invoiceId, UpdateInvoiceStatusRequest request) {
        Invoice invoice = invoices.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        String curStatus = invoice.getStatus();
        String nextStatus = request.status().toUpperCase();
        if ("PAID".equalsIgnoreCase(curStatus) && !"VOID".equalsIgnoreCase(nextStatus) && !"CANCELLED".equalsIgnoreCase(nextStatus)) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Cannot change status of a PAID invoice to " + nextStatus);
        }
        if ("VOID".equalsIgnoreCase(curStatus) || "CANCELLED".equalsIgnoreCase(curStatus)) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Cannot update a VOID or CANCELLED invoice");
        }
        invoice.setStatus(nextStatus);
        invoices.save(invoice);
        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse recordPayment(UUID invoiceId, RecordInvoicePaymentRequest request) {
        Invoice invoice = invoices.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));

        BigDecimal outstanding = invoice.getTotal().subtract(invoice.getAmountPaid());
        if (request.amount().compareTo(outstanding) > 0) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment amount exceeds outstanding balance of " + outstanding);
        }

        BigDecimal newPaid = invoice.getAmountPaid().add(request.amount());
        invoice.setAmountPaid(newPaid);
        if (newPaid.compareTo(invoice.getTotal()) >= 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIAL");
        }
        invoices.save(invoice);

        // Record in payment table
        Payment p = new Payment();
        p.setMember(invoice.getMember());
        p.setInvoiceId(invoice.getId());
        p.setSourceType("INVOICE");
        p.setSourceId(invoice.getId());
        p.setAmount(request.amount());
        p.setMethod(request.method().toUpperCase());
        p.setStatus("PAID");
        p.setPaidAt(Instant.now());
        p.setReference(request.reference());
        payments.save(p);

        // Record double-entry ledger posting
        ledgerService.postPayment(
                "INVOICE",
                invoice.getId(),
                "PAYMENT",
                "Payment for Invoice " + invoice.getInvoiceNumber(),
                invoice.getMember(),
                "INVOICE",
                request.method().toUpperCase(),
                request.amount(),
                false,
                null
        );

        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse issueCreditNote(UUID invoiceId, String reason) {
        Invoice original = invoices.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found: " + invoiceId));
        if (!"PAID".equalsIgnoreCase(original.getStatus()) && !"PARTIAL".equalsIgnoreCase(original.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Credit notes can only be issued against PAID or PARTIAL invoices");
        }
        Invoice creditNote = new Invoice();
        creditNote.setInvoiceNumber("CN-" + numberSeries.nextInvoiceNumber());
        creditNote.setMember(original.getMember());
        creditNote.setStatus("ISSUED");
        creditNote.setIssueDate(LocalDate.now(clock.withZone(ClubTime.IST)));
        creditNote.setDueDate(LocalDate.now(clock.withZone(ClubTime.IST)));
        creditNote.setCurrency(original.getCurrency());
        creditNote.setNotes("Credit Note for " + original.getInvoiceNumber() + ": " + (reason != null ? reason : ""));
        creditNote.setCreditNoteOf(original.getId());
        creditNote.setKind("CREDIT_NOTE");
        creditNote.setSubtotal(original.getSubtotal().negate());
        creditNote.setTaxTotal(original.getTaxTotal().negate());
        creditNote.setCgst(original.getCgst() != null ? original.getCgst().negate() : BigDecimal.ZERO);
        creditNote.setSgst(original.getSgst() != null ? original.getSgst().negate() : BigDecimal.ZERO);
        creditNote.setIgst(original.getIgst() != null ? original.getIgst().negate() : BigDecimal.ZERO);
        creditNote.setTotal(original.getTotal().negate());
        creditNote.setAmountPaid(BigDecimal.ZERO);
        invoices.save(creditNote);

        original.setStatus("CANCELLED");
        invoices.save(original);

        return mapper.toResponse(creditNote);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID id) {
        Invoice invoice = invoices.findById(id).orElseThrow(() -> new NotFoundException("Invoice not found"));
        return mapper.toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> listInvoices(UUID memberId, String status) {
        if (memberId != null) {
            return invoices.findByMember_IdOrderByCreatedAtDesc(memberId).stream().map(mapper::toResponse).toList();
        }
        if (status != null && !status.isBlank()) {
            return invoices.findByStatus(status).stream().map(mapper::toResponse).toList();
        }
        return invoices.findByOrderByCreatedAtDesc().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ExpenseResponse recordExpense(ExpenseRequest request) {
        Expense exp = new Expense();
        exp.setExpenseNumber(numberSeries.nextExpenseNumber());
        exp.setExpenseType(request.expenseType());
        exp.setDescription(request.description());
        exp.setAmount(request.amount());
        exp.setPaymentMethod(request.paymentMethod());
        exp.setIncurredAt(request.incurredAt() != null ? request.incurredAt() : Instant.now(clock));
        exp.setNotes(request.notes());

        if (request.recordedByUserId() != null) {
            AppUser u = users.findById(request.recordedByUserId()).orElse(null);
            exp.setRecordedBy(u);
        }

        expenses.save(exp);
        return mapper.toResponse(exp);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(String expenseType) {
        if (expenseType != null && !expenseType.isBlank()) {
            return expenses.findByExpenseType(expenseType).stream().map(mapper::toResponse).toList();
        }
        return expenses.findAll().stream().map(mapper::toResponse).toList();
    }
}
