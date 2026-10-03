package com.bookmycourt.finance.service;

import com.bookmycourt.admin.service.ClubQueryService;
import com.bookmycourt.common.sequence.NumberSeriesService;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.finance.dto.InvoiceResponse;
import com.bookmycourt.finance.dto.RecordInvoicePaymentRequest;
import com.bookmycourt.finance.entity.Invoice;
import com.bookmycourt.finance.mapper.FinanceMapper;
import com.bookmycourt.finance.repository.ExpenseRepository;
import com.bookmycourt.finance.repository.InvoiceRepository;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FinanceServiceTest {

    private InvoiceRepository invoices;
    private ExpenseRepository expenses;
    private MemberRepository members;
    private AppUserRepository users;
    private PaymentRepository payments;
    private NumberSeriesService numberSeries;
    private LedgerService ledgerService;
    private ClubQueryService clubQueryService;
    private FinanceService service;

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-10-03T10:00:00Z"),
            ClubTime.IST
    );

    @BeforeEach
    void setUp() {
        invoices = Mockito.mock(InvoiceRepository.class);
        expenses = Mockito.mock(ExpenseRepository.class);
        members = Mockito.mock(MemberRepository.class);
        users = Mockito.mock(AppUserRepository.class);
        payments = Mockito.mock(PaymentRepository.class);
        numberSeries = Mockito.mock(NumberSeriesService.class);
        ledgerService = Mockito.mock(LedgerService.class);
        clubQueryService = Mockito.mock(ClubQueryService.class);
        FinanceMapper mapper = new FinanceMapper();

        service = new FinanceService(
                invoices, expenses, members, users, payments, mapper,
                numberSeries, ledgerService, FIXED_CLOCK, clubQueryService
        );
    }

    @Test
    void recordPayment_updatesStatusAndPostsLedger() {
        UUID invoiceId = UUID.randomUUID();
        Invoice inv = new Invoice();
        inv.setId(invoiceId);
        inv.setInvoiceNumber("INV/2026-27/000001");
        inv.setTotal(new BigDecimal("1000.00"));
        inv.setAmountPaid(BigDecimal.ZERO);
        inv.setStatus("SENT");

        when(invoices.findById(invoiceId)).thenReturn(Optional.of(inv));

        RecordInvoicePaymentRequest req = new RecordInvoicePaymentRequest(new BigDecimal("1000.00"), "CASH", "CASH-1");
        InvoiceResponse resp = service.recordPayment(invoiceId, req);

        assertNotNull(resp);
        assertEquals("PAID", resp.status());
        assertEquals(new BigDecimal("1000.00"), inv.getAmountPaid());
        verify(invoices).save(inv);
        verify(ledgerService).postPayment(
                eq("INVOICE"),
                eq(invoiceId),
                eq("PAYMENT"),
                eq("Payment for Invoice INV/2026-27/000001"),
                any(),
                eq("INVOICE"),
                eq("CASH"),
                eq(new BigDecimal("1000.00")),
                eq(false),
                any()
        );
    }

    @Test
    void issueCreditNote_createsReversingInvoice() {
        UUID invoiceId = UUID.randomUUID();
        Invoice original = new Invoice();
        original.setId(invoiceId);
        original.setInvoiceNumber("INV/2026-27/000001");
        original.setTotal(new BigDecimal("1180.00"));
        original.setSubtotal(new BigDecimal("1000.00"));
        original.setTaxTotal(new BigDecimal("180.00"));
        original.setAmountPaid(new BigDecimal("1180.00"));
        original.setStatus("PAID");

        when(invoices.findById(invoiceId)).thenReturn(Optional.of(original));
        when(numberSeries.nextInvoiceNumber()).thenReturn("INV/2026-27/000002");

        InvoiceResponse cn = service.issueCreditNote(invoiceId, "Customer dispute resolved");

        assertNotNull(cn);
        assertEquals("CN-INV/2026-27/000002", cn.invoiceNumber());
        assertEquals(new BigDecimal("-1180.00"), cn.total());
        assertEquals("CANCELLED", original.getStatus());
        verify(invoices).save(original);
    }
}
