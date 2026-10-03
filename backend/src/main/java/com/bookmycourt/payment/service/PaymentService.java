package com.bookmycourt.payment.service;

import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.events.MoneyEvents.PaymentRecorded;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.finance.entity.Invoice;
import com.bookmycourt.finance.repository.InvoiceRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.payment.dto.CreatePaymentRequest;
import com.bookmycourt.payment.dto.ManualPaymentRequest;
import com.bookmycourt.payment.dto.PayNowRequest;
import com.bookmycourt.payment.dto.PaymentDueResponse;
import com.bookmycourt.payment.dto.PaymentResponse;
import com.bookmycourt.payment.dto.RefundRequest;
import com.bookmycourt.payment.dto.RefundResponse;
import com.bookmycourt.payment.dto.UpdatePaymentStatusRequest;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.entity.PaymentDue;
import com.bookmycourt.payment.entity.Refund;
import com.bookmycourt.payment.mapper.PaymentMapper;
import com.bookmycourt.payment.repository.PaymentDueRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import com.bookmycourt.payment.repository.RefundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository payments;
    private final PaymentDueRepository dues;
    private final RefundRepository refunds;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final BookingRepository bookings;
    private final InvoiceRepository invoices;
    private final MembershipRepository memberships;
    private final PaymentMapper mapper;
    private final DomainEventPublisher eventPublisher;

    public PaymentService(
            PaymentRepository payments,
            PaymentDueRepository dues,
            RefundRepository refunds,
            MemberRepository members,
            AppUserRepository users,
            BookingRepository bookings,
            InvoiceRepository invoices,
            MembershipRepository memberships,
            PaymentMapper mapper,
            DomainEventPublisher eventPublisher) {
        this.payments = payments;
        this.dues = dues;
        this.refunds = refunds;
        this.members = members;
        this.users = users;
        this.bookings = bookings;
        this.invoices = invoices;
        this.memberships = memberships;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public PaymentResponse payNow(PayNowRequest request) {
        BigDecimal amount = BigDecimal.ZERO;
        Member member = null;
        if (request.memberId() != null) {
            member = members.findById(request.memberId()).orElse(null);
        }

        if ("BOOKING".equalsIgnoreCase(request.sourceType())) {
            Booking b = bookings.findById(request.sourceId())
                    .orElseThrow(() -> new NotFoundException("Booking not found: " + request.sourceId()));
            if ("PAID".equalsIgnoreCase(b.getPaymentStatus())) {
                List<Payment> existing = payments.findByMember_IdOrderByCreatedAtDesc(b.getMember() != null ? b.getMember().getId() : null);
                for (Payment p : existing) {
                    if (request.sourceId().equals(p.getSourceId())) {
                        return mapper.toResponse(p);
                    }
                }
            }
            amount = b.getPriceCharged();
            if (member == null) {
                member = b.getMember();
            }
            b.setPaymentStatus("PAID");
            b.setStatus("CONFIRMED");
            b.setExpiresAt(null);
            bookings.save(b);
        } else if ("INVOICE".equalsIgnoreCase(request.sourceType())) {
            Invoice inv = invoices.findById(request.sourceId())
                    .orElseThrow(() -> new NotFoundException("Invoice not found: " + request.sourceId()));
            amount = inv.getTotal().subtract(inv.getAmountPaid());
            if (member == null) {
                member = inv.getMember();
            }
            inv.setAmountPaid(inv.getTotal());
            inv.setStatus("PAID");
            invoices.save(inv);
        } else if ("MEMBERSHIP".equalsIgnoreCase(request.sourceType())) {
            Membership m = memberships.findById(request.sourceId())
                    .orElseThrow(() -> new NotFoundException("Membership not found: " + request.sourceId()));
            amount = m.getPricePaid() != null && m.getPricePaid().compareTo(BigDecimal.ZERO) > 0
                    ? m.getPricePaid()
                    : (m.getPlan() != null && m.getPlan().getPrice() != null && m.getPlan().getPrice().compareTo(BigDecimal.ZERO) > 0
                            ? m.getPlan().getPrice()
                            : BigDecimal.valueOf(1500));
            if (member == null) {
                member = m.getMember();
            }
            m.setStatus("ACTIVE");
            m.setPaymentStatus("PAID");
            if (m.getStartDate() == null) {
                m.setStartDate(LocalDate.now());
                if (m.getPlan() != null) {
                    m.setEndDate(m.getStartDate().plusDays(m.getPlan().getValidityDays() > 0 ? m.getPlan().getValidityDays() - 1 : 364));
                }
            }
            m.setPricePaid(amount);
            memberships.save(m);
        }

        Payment payment = new Payment();
        payment.setMember(member);
        payment.setSourceType(request.sourceType().toUpperCase());
        payment.setSourceId(request.sourceId());
        payment.setAmount(amount != null && amount.compareTo(BigDecimal.ZERO) > 0 ? amount : BigDecimal.ZERO);
        payment.setMethod("ONLINE");
        payment.setSimulated(true);
        payment.setGateway("SIMULATED");
        payment.setGatewayTransactionId("SIM-" + UUID.randomUUID());
        payment.setStatus("PAID");
        payment.setPaidAt(Instant.now());
        payment.setReference("Simulated self-checkout");
        payments.save(payment);

        eventPublisher.publish(new PaymentRecorded(
                payment.getId(),
                payment.getMember() != null ? payment.getMember().getId() : null,
                payment.getAmount(),
                payment.getMethod(),
                payment.getSourceType(),
                payment.getSourceId()
        ));

        return mapper.toResponse(payment);
    }

    @Transactional
    public PaymentResponse recordManual(ManualPaymentRequest request) {
        Member member = null;
        if (request.memberId() != null) {
            member = members.findById(request.memberId()).orElse(null);
        }

        BigDecimal change = BigDecimal.ZERO;
        if ("CASH".equalsIgnoreCase(request.method()) && request.tendered() != null) {
            if (request.tendered().compareTo(request.amount()) < 0) {
                throw new IllegalArgumentException("Tendered amount must be greater than or equal to due amount");
            }
            change = request.tendered().subtract(request.amount());
        }

        Payment payment = new Payment();
        payment.setMember(member);
        payment.setSourceType(request.sourceType().toUpperCase());
        payment.setSourceId(request.sourceId());
        payment.setAmount(request.amount());
        payment.setMethod(request.method().toUpperCase());
        payment.setReference(request.reference());
        payment.setTendered(request.tendered());
        payment.setChangeGiven(change);
        payment.setCashShiftId(request.cashShiftId());
        payment.setStatus("PAID");
        payment.setPaidAt(Instant.now());

        // Validate and update target entity status
        if ("BOOKING".equalsIgnoreCase(request.sourceType()) && request.sourceId() != null) {
            Booking b = bookings.findById(request.sourceId())
                    .orElseThrow(() -> new NotFoundException("Booking not found: " + request.sourceId()));
            if (b.getPriceCharged() != null && request.amount().compareTo(b.getPriceCharged()) < 0) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment amount " + request.amount() + " is less than booking price " + b.getPriceCharged());
            }
            b.setPaymentStatus("PAID");
            b.setStatus("CONFIRMED");
            b.setExpiresAt(null);
            bookings.save(b);
        } else if ("INVOICE".equalsIgnoreCase(request.sourceType()) && request.sourceId() != null) {
            Invoice inv = invoices.findById(request.sourceId())
                    .orElseThrow(() -> new NotFoundException("Invoice not found: " + request.sourceId()));
            BigDecimal outstanding = inv.getTotal().subtract(inv.getAmountPaid());
            if (request.amount().compareTo(outstanding) > 0) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment amount " + request.amount() + " exceeds invoice outstanding balance " + outstanding);
            }
            BigDecimal newPaid = inv.getAmountPaid().add(request.amount());
            inv.setAmountPaid(newPaid);
            if (newPaid.compareTo(inv.getTotal()) >= 0) {
                inv.setStatus("PAID");
            } else {
                inv.setStatus("PARTIAL");
            }
            invoices.save(inv);
        } else if ("MEMBERSHIP".equalsIgnoreCase(request.sourceType()) && request.sourceId() != null) {
            Membership m = memberships.findById(request.sourceId())
                    .orElseThrow(() -> new NotFoundException("Membership not found: " + request.sourceId()));
            m.setStatus("ACTIVE");
            m.setPaymentStatus("PAID");
            m.setPricePaid(request.amount());
            memberships.save(m);
        }

        payments.save(payment);

        eventPublisher.publish(new PaymentRecorded(
                payment.getId(),
                payment.getMember() != null ? payment.getMember().getId() : null,
                payment.getAmount(),
                payment.getMethod(),
                payment.getSourceType(),
                payment.getSourceId()
        ));

        return mapper.toResponse(payment);
    }

    @Transactional
    public RefundResponse refund(UUID paymentId, RefundRequest request) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));

        if (!"PAID".equalsIgnoreCase(payment.getStatus()) && !"PARTIALLY_REFUNDED".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalStateException("Payment status is " + payment.getStatus() + ", cannot refund");
        }

        BigDecimal newTotalRefunded = payment.getRefundedTotal().add(request.amount());
        if (newTotalRefunded.compareTo(payment.getAmount()) > 0) {
            throw new IllegalArgumentException("Total refunded amount cannot exceed original payment amount");
        }

        payment.setRefundedTotal(newTotalRefunded);
        if (newTotalRefunded.compareTo(payment.getAmount()) == 0) {
            payment.setStatus("REFUNDED");
        } else {
            payment.setStatus("PARTIALLY_REFUNDED");
        }
        payments.save(payment);

        Refund r = new Refund();
        r.setPayment(payment);
        r.setAmount(request.amount());
        r.setReason(request.reason());
        r.setStatus("PROCESSED");
        r.setReference(request.reference() != null ? request.reference() : "REF-" + UUID.randomUUID().toString().substring(0, 8));
        r.setProcessedAt(Instant.now());
        refunds.save(r);

        // Reverse source entity state
        if ("BOOKING".equalsIgnoreCase(payment.getSourceType()) && payment.getSourceId() != null) {
            bookings.findById(payment.getSourceId()).ifPresent(b -> {
                b.setPaymentStatus("REFUNDED");
                b.setStatus("CANCELLED");
                bookings.save(b);
            });
        } else if ("INVOICE".equalsIgnoreCase(payment.getSourceType()) && payment.getSourceId() != null) {
            invoices.findById(payment.getSourceId()).ifPresent(inv -> {
                BigDecimal remainingPaid = inv.getAmountPaid().subtract(request.amount()).max(BigDecimal.ZERO);
                inv.setAmountPaid(remainingPaid);
                if (remainingPaid.compareTo(BigDecimal.ZERO) == 0) {
                    inv.setStatus("REFUNDED");
                } else {
                    inv.setStatus("PARTIAL");
                }
                invoices.save(inv);
            });
        } else if ("MEMBERSHIP".equalsIgnoreCase(payment.getSourceType()) && payment.getSourceId() != null) {
            memberships.findById(payment.getSourceId()).ifPresent(m -> {
                m.setStatus("CANCELLED");
                m.setPaymentStatus("REFUNDED");
                memberships.save(m);
            });
        }

        return new RefundResponse(
                r.getId(),
                payment.getId(),
                r.getAmount(),
                r.getReason(),
                r.getStatus(),
                r.getReference(),
                r.getCreatedAt(),
                r.getProcessedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> listRefunds(UUID paymentId) {
        return refunds.findByPayment_IdOrderByCreatedAtDesc(paymentId).stream()
                .map(r -> new RefundResponse(
                        r.getId(),
                        r.getPayment().getId(),
                        r.getAmount(),
                        r.getReason(),
                        r.getStatus(),
                        r.getReference(),
                        r.getCreatedAt(),
                        r.getProcessedAt()
                ))
                .toList();
    }

    @Transactional
    public PaymentResponse collectDue(UUID dueId, ManualPaymentRequest tenderRequest) {
        PaymentDue due = dues.findById(dueId)
                .orElseThrow(() -> new NotFoundException("Due not found: " + dueId));

        if (!"OPEN".equalsIgnoreCase(due.getStatus())) {
            throw new IllegalStateException("Due is already " + due.getStatus());
        }

        PaymentResponse paymentResp = recordManual(tenderRequest);
        due.setStatus("COLLECTED");
        due.setCollectedPaymentId(paymentResp.id());
        dues.save(due);
        return paymentResp;
    }

    @Transactional
    public PaymentDueResponse writeOffDue(UUID dueId, String reason) {
        PaymentDue due = dues.findById(dueId)
                .orElseThrow(() -> new NotFoundException("Due not found: " + dueId));
        due.setStatus("WRITTEN_OFF");
        due.setReason(reason);
        dues.save(due);
        return toDueResponse(due);
    }

    @Transactional(readOnly = true)
    public List<PaymentDueResponse> listDues(UUID memberId, String status) {
        List<PaymentDue> list;
        if (memberId != null && status != null) {
            list = dues.findByMember_IdAndStatusOrderByDueSinceDesc(memberId, status);
        } else if (memberId != null) {
            list = dues.findByMember_IdOrderByDueSinceDesc(memberId);
        } else if (status != null) {
            list = dues.findByStatusOrderByDueSinceDesc(status);
        } else {
            list = dues.findAll();
        }
        return list.stream().map(this::toDueResponse).toList();
    }

    private PaymentDueResponse toDueResponse(PaymentDue d) {
        return new PaymentDueResponse(
                d.getId(),
                d.getRefType(),
                d.getRefId(),
                d.getMember() != null ? d.getMember().getId() : null,
                d.getAmount(),
                d.getDueSince(),
                d.getStatus(),
                d.getReason()
        );
    }

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        Payment payment = new Payment();
        if (request.memberId() != null) {
            Member member = members.findById(request.memberId())
                    .orElseThrow(() -> new NotFoundException("Member not found"));
            payment.setMember(member);
        }
        payment.setInvoiceId(request.invoiceId());
        payment.setSourceType(request.sourceType());
        payment.setSourceId(request.sourceId());
        payment.setAmount(request.amount());
        payment.setMethod(request.method());
        payment.setGateway(request.gateway());
        payment.setGatewayTransactionId(request.gatewayTransactionId());
        payment.setReference(request.reference());

        if ("CASH".equalsIgnoreCase(request.method()) || "CARD".equalsIgnoreCase(request.method()) || "UPI".equalsIgnoreCase(request.method()) || "ONLINE".equalsIgnoreCase(request.method())) {
            payment.setStatus("PAID");
            payment.setPaidAt(Instant.now());
            if ("ONLINE".equalsIgnoreCase(request.method()) && (payment.getGatewayTransactionId() == null || payment.getGatewayTransactionId().isBlank())) {
                payment.setGatewayTransactionId("SIM-" + UUID.randomUUID());
                payment.setSimulated(true);
            }
        } else {
            payment.setStatus("PENDING");
        }

        payments.save(payment);
        return mapper.toResponse(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID id) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        return mapper.toResponse(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(UUID memberId, String sourceType) {
        if (memberId != null) {
            return payments.findByMember_IdOrderByCreatedAtDesc(memberId).stream()
                    .map(mapper::toResponse)
                    .toList();
        }
        return payments.findByOrderByCreatedAtDesc().stream()
                .filter(p -> sourceType == null || p.getSourceType().equalsIgnoreCase(sourceType))
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse updateStatus(UUID id, UpdatePaymentStatusRequest request) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        payment.setStatus(request.status());
        if ("PAID".equalsIgnoreCase(request.status()) && payment.getPaidAt() == null) {
            payment.setPaidAt(Instant.now());
        }
        if (request.gatewayTransactionId() != null) {
            payment.setGatewayTransactionId(request.gatewayTransactionId());
        }
        if (request.reference() != null) {
            payment.setReference(request.reference());
        }
        if (request.receivedByUserId() != null) {
            AppUser user = users.findById(request.receivedByUserId()).orElse(null);
            payment.setReceivedBy(user);
        }
        payments.save(payment);
        return mapper.toResponse(payment);
    }
}
