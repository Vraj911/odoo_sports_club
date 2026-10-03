package com.bookmycourt.payment.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.membership.entity.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "payment_due")
public class PaymentDue extends BaseEntity {

    @Column(name = "ref_type", nullable = false, length = 40)
    private String refType;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "due_since", nullable = false)
    private OffsetDateTime dueSince = OffsetDateTime.now();

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(name = "collected_payment_id")
    private UUID collectedPaymentId;

    @Column(name = "written_off_by")
    private UUID writtenOffBy;

    private String reason;
}
