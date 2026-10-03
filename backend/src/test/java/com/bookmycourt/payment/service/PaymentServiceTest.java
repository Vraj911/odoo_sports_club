package com.bookmycourt.payment.service;

import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.finance.repository.InvoiceRepository;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.payment.dto.ManualPaymentRequest;
import com.bookmycourt.payment.dto.PayNowRequest;
import com.bookmycourt.payment.dto.PaymentResponse;
import com.bookmycourt.payment.dto.RefundRequest;
import com.bookmycourt.payment.dto.RefundResponse;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.mapper.PaymentMapper;
import com.bookmycourt.payment.repository.PaymentDueRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import com.bookmycourt.payment.repository.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceTest {

    private PaymentRepository payments;
    private PaymentDueRepository dues;
    private RefundRepository refunds;
    private MemberRepository members;
    private AppUserRepository users;
    private BookingRepository bookings;
    private InvoiceRepository invoices;
    private MembershipRepository memberships;
    private DomainEventPublisher publisher;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        payments = Mockito.mock(PaymentRepository.class);
        dues = Mockito.mock(PaymentDueRepository.class);
        refunds = Mockito.mock(RefundRepository.class);
        members = Mockito.mock(MemberRepository.class);
        users = Mockito.mock(AppUserRepository.class);
        bookings = Mockito.mock(BookingRepository.class);
        invoices = Mockito.mock(InvoiceRepository.class);
        memberships = Mockito.mock(MembershipRepository.class);
        publisher = Mockito.mock(DomainEventPublisher.class);
        PaymentMapper mapper = new PaymentMapper();

        service = new PaymentService(
                payments, dues, refunds, members, users,
                bookings, invoices, memberships, mapper, publisher
        );
    }

    @Test
    void payNow_forBooking_setsSimulatedOnlineAndPaid() {
        UUID bookingId = UUID.randomUUID();
        Booking b = new Booking();
        b.setPriceCharged(new BigDecimal("500.00"));
        b.setPaymentStatus("UNPAID");

        when(bookings.findById(bookingId)).thenReturn(Optional.of(b));

        PayNowRequest request = new PayNowRequest("BOOKING", bookingId, null);
        PaymentResponse response = service.payNow(request);

        assertNotNull(response);
        assertEquals("PAID", response.status());
        assertEquals("ONLINE", response.method());
        assertTrue(response.gatewayTransactionId().startsWith("SIM-"));
        assertEquals(new BigDecimal("500.00"), response.amount());

        assertEquals("PAID", b.getPaymentStatus());
        assertEquals("CONFIRMED", b.getStatus());
    }

    @Test
    void recordManual_withCash_calculatesCorrectChange() {
        UUID orderId = UUID.randomUUID();
        ManualPaymentRequest req = new ManualPaymentRequest(
                "SHOP",
                orderId,
                null,
                new BigDecimal("350.00"),
                "CASH",
                "CASH-123",
                new BigDecimal("500.00"),
                null
        );

        PaymentResponse resp = service.recordManual(req);
        assertNotNull(resp);
        assertEquals("PAID", resp.status());

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(payments).save(captor.capture());
        Payment saved = captor.getValue();

        assertEquals(new BigDecimal("350.00"), saved.getAmount());
        assertEquals(new BigDecimal("500.00"), saved.getTendered());
        assertEquals(new BigDecimal("150.00"), saved.getChangeGiven());
    }

    @Test
    void recordManual_insufficientTenderedCash_throwsException() {
        UUID orderId = UUID.randomUUID();
        ManualPaymentRequest req = new ManualPaymentRequest(
                "SHOP",
                orderId,
                null,
                new BigDecimal("350.00"),
                "CASH",
                null,
                new BigDecimal("300.00"),
                null
        );

        assertThrows(IllegalArgumentException.class, () -> service.recordManual(req));
    }

    @Test
    void refund_exceedingAmount_throwsException() {
        UUID paymentId = UUID.randomUUID();
        Payment p = new Payment();
        p.setAmount(new BigDecimal("500.00"));
        p.setRefundedTotal(new BigDecimal("400.00"));
        p.setStatus("PARTIALLY_REFUNDED");

        when(payments.findById(paymentId)).thenReturn(Optional.of(p));

        RefundRequest req = new RefundRequest(new BigDecimal("150.00"), "Too much", null);
        assertThrows(IllegalArgumentException.class, () -> service.refund(paymentId, req));
    }

    @Test
    void refund_validAmount_recordsProcessedRefund() {
        UUID paymentId = UUID.randomUUID();
        Payment p = new Payment();
        p.setAmount(new BigDecimal("500.00"));
        p.setRefundedTotal(BigDecimal.ZERO);
        p.setStatus("PAID");

        when(payments.findById(paymentId)).thenReturn(Optional.of(p));

        RefundRequest req = new RefundRequest(new BigDecimal("500.00"), "Cancelled", null);
        RefundResponse resp = service.refund(paymentId, req);

        assertNotNull(resp);
        assertEquals("PROCESSED", resp.status());
        assertEquals(new BigDecimal("500.00"), resp.amount());
        assertEquals("REFUNDED", p.getStatus());
        assertEquals(new BigDecimal("500.00"), p.getRefundedTotal());
    }
}
