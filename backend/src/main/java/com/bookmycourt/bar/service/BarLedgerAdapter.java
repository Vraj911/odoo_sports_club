package com.bookmycourt.bar.service;

import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.CashShift;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.repository.PaymentRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * FIN-01 / BR-10: every rupee also lands in the unified payment ledger, tagged source = BAR and its method.
 *
 * THIS IS THE ONLY CLASS THAT TOUCHES THE Payment ENTITY. I could not see Payment, so the setters below are
 * assumed (setCashShiftId/setStatus/setMethod/setAmount are implied by your old BarService; setSource and
 * setReference are assumed from section 6.2). Adjust names / add any NOT NULL columns your table needs.
 */
@Component
public class BarLedgerAdapter {

    private final PaymentRepository payments;

    public BarLedgerAdapter(PaymentRepository payments) {
        this.payments = payments;
    }

    public UUID record(BarOrder order, String method, BigDecimal amount, String reference, CashShift shift) {
        Payment p = new Payment();
        p.setSource("BAR");
        p.setMethod(method);
        p.setAmount(amount);
        p.setStatus("PAID");
        p.setReference(order.getOrderNumber() + (reference == null || reference.isBlank() ? "" : " / " + reference));
        p.setCashShiftId(shift == null ? null : shift.getId());
        payments.save(p);
        return p.getId();
    }
}