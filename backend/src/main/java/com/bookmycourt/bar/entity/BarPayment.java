package com.bookmycourt.bar.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.membership.entity.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/** Tender detail of a bar sale (split payments, change). The money itself is also written to the unified ledger. */
@Getter
@Setter
@Entity
@Table(name = "bar_payment")
public class BarPayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bar_order_id", nullable = false)
    private BarOrder barOrder;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private BigDecimal tendered;

    @Column(name = "change_given", nullable = false)
    private BigDecimal changeGiven = BigDecimal.ZERO;

    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by")
    private AppUser receivedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cash_shift_id")
    private CashShift cashShift;

    @Column(name = "ledger_payment_id")
    private UUID ledgerPaymentId;

    @Column(name = "idempotency_key")
    private String idempotencyKey;
}
