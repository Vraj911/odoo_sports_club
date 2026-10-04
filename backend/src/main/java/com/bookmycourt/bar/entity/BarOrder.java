package com.bookmycourt.bar.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "bar_order")
public class BarOrder extends BaseEntity {

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private BarTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "guest_name")
    private String guestName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opened_by")
    private AppUser openedBy;

    /** BAR-11: shift the order was taken in. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cash_shift_id")
    private CashShift cashShift;

    /** BAR-06: tab this order accrues to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tab_id")
    private BarTab tab;

    /** OPEN, SENT, PARTIALLY_PAID, PAID, ON_ACCOUNT, VOID, CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    /** BR-09: discount rule snapshot. */
    @Column(name = "member_discount_percent", nullable = false)
    private BigDecimal memberDiscountPercent = BigDecimal.ZERO;

    @Column(name = "discount_source")
    private String discountSource;

    @Column(name = "member_discount_amount", nullable = false)
    private BigDecimal memberDiscountAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_total", nullable = false)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "amount_paid", nullable = false)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "void_reason")
    private String voidReason;

    @OneToMany(mappedBy = "barOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BarOrderLine> lines = new ArrayList<>();
}