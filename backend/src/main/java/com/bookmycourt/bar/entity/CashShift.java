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
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "cash_shift")
public class CashShift extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_user_id", nullable = false)
    private AppUser staffUser;

    @Column(nullable = false, length = 20)
    private String scope = "BAR";

    @Column(name = "opened_at", nullable = false)
    private OffsetDateTime openedAt = OffsetDateTime.now();

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "opening_float", nullable = false)
    private BigDecimal openingFloat = BigDecimal.ZERO;

    @Column(name = "expected_cash", nullable = false)
    private BigDecimal expectedCash = BigDecimal.ZERO;

    @Column(name = "counted_cash", nullable = false)
    private BigDecimal countedCash = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal variance = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status = "OPEN";
}
