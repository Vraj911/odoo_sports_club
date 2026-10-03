package com.bookmycourt.payment.mapper;

import com.bookmycourt.payment.dto.PaymentResponse;
import com.bookmycourt.payment.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment p) {
        String memberName = null;
        if (p.getMember() != null) {
            memberName = p.getMember().getFirstName() + " " + p.getMember().getLastName();
        }
        return new PaymentResponse(
                p.getId(),
                p.getMember() == null ? null : p.getMember().getId(),
                memberName,
                p.getInvoiceId(),
                p.getSourceType(),
                p.getSourceId(),
                p.getAmount(),
                p.getMethod(),
                p.getGateway(),
                p.getGatewayTransactionId(),
                p.getStatus(),
                p.getPaidAt(),
                p.getReference(),
                p.getCreatedAt()
        );
    }
}
