package com.bookmycourt.finance.service;

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

    public FinanceService(
            InvoiceRepository invoices,
            ExpenseRepository expenses,
            MemberRepository members,
            AppUserRepository users,
            PaymentRepository payments,
            FinanceMapper mapper) {
        this.invoices = invoices;
        this.expenses = expenses;
        this.members = members;
        this.users = users;
        this.payments = payments;
        this.mapper = mapper;
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Member member = null;
        if (request.memberId() != null) {
            member = members.findById(request.memberId())
                    .orElseThrow(() -> new NotFoundException("Member not found"));
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setMember(member);
        invoice.setStatus("DRAFT");
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(request.dueDate() != null ? request.dueDate() : LocalDate.now().plusDays(15));
        invoice.setCurrency("INR");
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

        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(taxTotal);
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
        invoice.setStatus(request.status());
        invoices.save(invoice);
        return mapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse recordPayment(UUID invoiceId, RecordInvoicePaymentRequest request) {
        Invoice invoice = invoices.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));

        BigDecimal newPaid = invoice.getAmountPaid().add(request.amount());
        if (newPaid.compareTo(invoice.getTotal()) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds outstanding balance");
        }

        invoice.setAmountPaid(newPaid);
        if (newPaid.compareTo(invoice.getTotal()) >= 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIAL");
        }
        invoices.save(invoice);

        // Record in payment ledger
        Payment p = new Payment();
        p.setMember(invoice.getMember());
        p.setInvoiceId(invoice.getId());
        p.setSourceType("INVOICE");
        p.setSourceId(invoice.getId());
        p.setAmount(request.amount());
        p.setMethod(request.method());
        p.setStatus("PAID");
        p.setPaidAt(Instant.now());
        p.setReference(request.reference());
        payments.save(p);

        return mapper.toResponse(invoice);
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
        Expense expense = new Expense();
        expense.setExpenseNumber("EXP-" + System.currentTimeMillis());
        expense.setExpenseType(request.expenseType());
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setPaymentMethod(request.paymentMethod());
        expense.setIncurredAt(request.incurredAt() != null ? request.incurredAt() : Instant.now());
        if (request.recordedByUserId() != null) {
            AppUser u = users.findById(request.recordedByUserId()).orElse(null);
            expense.setRecordedBy(u);
        }
        expense.setNotes(request.notes());
        expenses.save(expense);
        return mapper.toResponse(expense);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(String expenseType) {
        if (expenseType != null && !expenseType.isBlank()) {
            return expenses.findByExpenseType(expenseType).stream().map(mapper::toResponse).toList();
        }
        return expenses.findByOrderByIncurredAtDesc().stream().map(mapper::toResponse).toList();
    }
}
