package com.bookmycourt.payment.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.payment.dto.CreatePaymentRequest;
import com.bookmycourt.payment.dto.PaymentResponse;
import com.bookmycourt.payment.dto.UpdatePaymentStatusRequest;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.mapper.PaymentMapper;
import com.bookmycourt.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository payments;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final PaymentMapper mapper;

    public PaymentService(
            PaymentRepository payments,
            MemberRepository members,
            AppUserRepository users,
            PaymentMapper mapper) {
        this.payments = payments;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
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

        if ("CASH".equalsIgnoreCase(request.method()) || "CARD".equalsIgnoreCase(request.method()) || "UPI".equalsIgnoreCase(request.method())) {
            payment.setStatus("PAID");
            payment.setPaidAt(Instant.now());
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
