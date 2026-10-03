package com.bookmycourt.finance.service;

import com.bookmycourt.admin.service.ClubQueryService;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.common.time.ClubTime;
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
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FinanceService {

    /**
     * FIN-01 payment methods.
     */
    private static final Set<String> METHODS = Set.of("CASH", "CARD", "UPI", "ONLINE");

    /**
     * Manual status moves only (Appendix A). PAID / PARTIAL are set by
     * payments, never by hand.
     */
    private static final Map<String, Set<String>> MANUAL_TRANSITIONS = Map.of(
            "DRAFT", Set.of("SENT", "VOID"),
            "SENT", Set.of("OVERDUE", "VOID"),
            "PARTIAL", Set.of("OVERDUE"),
            "OVERDUE", Set.of("VOID")
    );

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

    /**
     * The logged-in user, never a client-supplied id (audit trail must not be
     * spoofable).
     */
    private AppUser currentUser() {
        Actor a = ActorHolder.current();
        if (a == null || a.userId() == null) {
            return null;
        }
        return users.findById(a.userId()).orElse(null);
    }

    // ---------------------------------------------------------------- invoices
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
        } catch (Exception ignored) {
        }
        invoice.setCurrency(currency);
        invoice.setNotes(request.notes());
        invoice.setCreatedBy(currentUser());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        List<InvoiceLine> lines = new ArrayList<>();

        for (InvoiceLineRequest item : request.items()) {
            BigDecimal qty = item.quantity();
            BigDecimal price = item.unitPrice();
            BigDecimal taxRate = item.taxRate() != null ? item.taxRate() : BigDecimal.ZERO;
            if (taxRate.signum() < 0 || taxRate.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Tax rate must be between 0 and 100");
            }

            BigDecimal lineSubtotal = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxAmount = lineSubtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            InvoiceLine line = new InvoiceLine();
            line.setInvoice(invoice);
            line.setDescription(item.description());
            line.setSourceType(item.sourceType());
            line.setSourceId(item.sourceId());
            line.setQuantity(qty);
            line.setUnitPrice(price);
            line.setTaxRate(taxRate);
            line.setTaxAmount(taxAmount);
            line.setLineTotal(lineSubtotal.add(taxAmount));
            lines.add(line);

            subtotal = subtotal.add(lineSubtotal);
            taxTotal = taxTotal.add(taxAmount);
        }

        // Intra-state split. IGST needs the client's GSTIN/state, which this module does not hold yet (FIN-07/FIN-08).
        BigDecimal cgst = taxTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(taxTotal);
        invoice.setCgst(cgst);
        invoice.setSgst(taxTotal.subtract(cgst));
        invoice.setIgst(BigDecimal.ZERO);
        invoice.setTotal(subtotal.add(taxTotal));
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setLines(lines);

        invoices.save(invoice);
        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse updateStatus(UUID invoiceId, UpdateInvoiceStatusRequest request) {
        Invoice invoice = invoices.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if ("CREDIT_NOTE".equalsIgnoreCase(invoice.getKind())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Credit notes cannot be edited");
        }

        String cur = invoice.getStatus().toUpperCase(Locale.ROOT);
        String next = request.status().trim().toUpperCase(Locale.ROOT);

        if (cur.equals(next)) {
            return mapper.toResponse(invoice);
        }
        if (!MANUAL_TRANSITIONS.getOrDefault(cur, Set.of()).contains(next)) {
            String hint = "PAID".equals(cur) || "PARTIAL".equals(cur)
                    ? " (an invoice with payments can only be reversed with a credit note)" : "";
            throw new DomainException(ErrorCode.INVALID_STATE,
                    "Cannot change invoice from " + cur + " to " + next + hint);
        }
        invoice.setStatus(next);
        invoices.save(invoice);
        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse recordPayment(UUID invoiceId, RecordInvoicePaymentRequest request) {
        String method = request.method().trim().toUpperCase(Locale.ROOT);
        if (!METHODS.contains(method)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment method must be one of " + METHODS);
        }
        String reference = (request.reference() == null || request.reference().isBlank()) ? null : request.reference().trim();
        if (!"CASH".equals(method) && reference == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A reference number is required for " + method + " payments");
        }

        // Row lock: two simultaneous payments can no longer both pass the outstanding check.
        Invoice invoice = invoices.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));

        String status = invoice.getStatus().toUpperCase(Locale.ROOT);
        if ("CREDIT_NOTE".equalsIgnoreCase(invoice.getKind()) || Set.of("VOID", "CANCELLED", "PAID").contains(status)) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Payments cannot be recorded on a " + status + " invoice");
        }

        // Retry safety (NFR-01): the same reference on the same invoice is the same payment.
        if (reference != null && payments.existsByInvoiceIdAndReference(invoiceId, reference)) {
            return mapper.toResponse(invoice);
        }

        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal outstanding = invoice.getTotal().subtract(invoice.getAmountPaid());
        if (amount.compareTo(outstanding) > 0) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment amount exceeds outstanding balance of " + outstanding);
        }

        BigDecimal newPaid = invoice.getAmountPaid().add(amount);
        invoice.setAmountPaid(newPaid);
        invoice.setStatus(newPaid.compareTo(invoice.getTotal()) >= 0 ? "PAID" : "PARTIAL");
        invoices.save(invoice);

        Payment p = new Payment();
        p.setMember(invoice.getMember());
        p.setInvoiceId(invoice.getId());
        p.setSourceType(paymentSource(invoice)); // COURT / MEMBERSHIP / SHOP / BAR / OTHER (FIN-01), not "INVOICE"
        p.setSourceId(invoice.getId());
        p.setAmount(amount);
        p.setMethod(method);
        p.setStatus("PAID");
        p.setPaidAt(Instant.now(clock));
        p.setReference(reference);
        Payment saved = payments.save(p);

        // Ledger: make sure the invoice's receivable exists, then post THIS payment.
        // Keyed by payment id, so a 2nd partial payment is no longer swallowed by the idempotency check.
        ledgerService.ensureInvoiceIssued(invoice);
        ledgerService.postPayment(
                "INVOICE_PAYMENT",
                saved.getId(),
                "PAYMENT",
                "Payment for Invoice " + invoice.getInvoiceNumber(),
                invoice.getMember(),
                "INVOICE",
                method,
                amount,
                false,
                currentUser()
        );

        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse issueCreditNote(UUID invoiceId, String reason) {
        Invoice original = invoices.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found: " + invoiceId));
        if (!"PAID".equalsIgnoreCase(original.getStatus()) && !"PARTIAL".equalsIgnoreCase(original.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Credit notes can only be issued against PAID or PARTIAL invoices");
        }
        if (reason == null || reason.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A reason is required for a credit note");
        }

        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        Invoice cn = new Invoice();
        // TODO BR-12: use a separate credit-note number series. This still consumes an invoice number.
        cn.setInvoiceNumber("CN-" + numberSeries.nextInvoiceNumber());
        cn.setMember(original.getMember());
        cn.setStatus("ISSUED");
        cn.setIssueDate(today);
        cn.setDueDate(today);
        cn.setCurrency(original.getCurrency());
        cn.setNotes("Credit Note for " + original.getInvoiceNumber() + ": " + reason.trim());
        cn.setCreditNoteOf(original.getId());
        cn.setKind("CREDIT_NOTE");
        cn.setCreatedBy(currentUser());
        cn.setSubtotal(original.getSubtotal().negate());
        cn.setTaxTotal(original.getTaxTotal().negate());
        cn.setCgst(original.getCgst() != null ? original.getCgst().negate() : BigDecimal.ZERO);
        cn.setSgst(original.getSgst() != null ? original.getSgst().negate() : BigDecimal.ZERO);
        cn.setIgst(original.getIgst() != null ? original.getIgst().negate() : BigDecimal.ZERO);
        cn.setTotal(original.getTotal().negate());
        cn.setAmountPaid(BigDecimal.ZERO);
        invoices.save(cn);

        original.setStatus("CANCELLED");
        invoices.save(original);
        return mapper.toResponse(cn);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID id) {
        return mapper.toResponse(invoices.findById(id).orElseThrow(() -> new NotFoundException("Invoice not found")));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> listInvoices(UUID memberId, String status) {
        List<Invoice> rows = memberId != null
                ? invoices.findByMember_IdOrderByCreatedAtDesc(memberId)
                : (status != null && !status.isBlank() ? invoices.findByStatus(status.toUpperCase(Locale.ROOT))
                : invoices.findByOrderByCreatedAtDesc());
        if (memberId != null && status != null && !status.isBlank()) {
            String s = status.toUpperCase(Locale.ROOT);
            rows = rows.stream().filter(i -> s.equalsIgnoreCase(i.getStatus())).toList();
        }
        return rows.stream().map(mapper::toResponse).toList();
    }

    // ---------------------------------------------------------------- expenses
    @Transactional
    public ExpenseResponse recordExpense(ExpenseRequest request) {
        String method = request.paymentMethod().trim().toUpperCase(Locale.ROOT);
        if (!METHODS.contains(method)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment method must be one of " + METHODS);
        }
        Expense exp = new Expense();
        exp.setExpenseNumber(numberSeries.nextExpenseNumber());
        exp.setExpenseType(request.expenseType().trim().toUpperCase(Locale.ROOT));
        exp.setDescription(request.description());
        exp.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        exp.setPaymentMethod(method);
        exp.setIncurredAt(request.incurredAt() != null ? request.incurredAt() : Instant.now(clock));
        exp.setNotes(request.notes());
        exp.setRecordedBy(currentUser());
        expenses.save(exp);
        return mapper.toResponse(exp);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(String expenseType) {
        List<Expense> rows = (expenseType != null && !expenseType.isBlank())
                ? expenses.findByExpenseType(expenseType.trim().toUpperCase(Locale.ROOT))
                : expenses.findByOrderByIncurredAtDesc();
        return rows.stream().map(mapper::toResponse).toList();
    }

    // ----------------------------------------------------------------- helpers
    /**
     * FIN-01 source tag, derived from what the invoice is for. Mixed or unknown
     * lines become OTHER.
     */
    private static String paymentSource(Invoice inv) {
        Set<String> types = inv.getLines() == null ? Set.of() : inv.getLines().stream()
                .map(InvoiceLine::getSourceType)
                .filter(Objects::nonNull)
                .map(s -> s.toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (types.size() != 1) {
            return "OTHER";
        }
        return switch (types.iterator().next()) {
            case "BOOKING", "COURT" ->
                "COURT";
            case "MEMBERSHIP", "PLAN" ->
                "MEMBERSHIP";
            case "SHOP", "SHOP_ORDER" ->
                "SHOP";
            case "BAR", "BAR_ORDER", "TAB" ->
                "BAR";
            default ->
                "OTHER";
        };
    }
}
