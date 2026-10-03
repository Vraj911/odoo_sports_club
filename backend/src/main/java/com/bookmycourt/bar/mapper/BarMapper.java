package com.bookmycourt.bar.mapper;

import com.bookmycourt.bar.dto.BarOrderLineResponse;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.BarPaymentResponse;
import com.bookmycourt.bar.dto.BarTableResponse;
import com.bookmycourt.bar.dto.KdsLineResponse;
import com.bookmycourt.bar.dto.MenuItemResponse;
import com.bookmycourt.bar.dto.TabResponse;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarOrderLine;
import com.bookmycourt.bar.entity.BarPayment;
import com.bookmycourt.bar.entity.BarTab;
import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.entity.MenuItem;
import com.bookmycourt.bar.service.BarStatus;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class BarMapper {

    private final Clock clock;

    public BarMapper(Clock clock) {
        this.clock = clock;
    }

    public MenuItemResponse toResponse(MenuItem m) {
        return new MenuItemResponse(
                m.getId(), m.getCategory(), m.getName(), m.getDescription(), m.getPrice(), m.getTaxRate(),
                m.isAvailable(), m.getStation(), m.isTaxInclusive(), m.getCreatedAt());
    }

    public BarTableResponse toResponse(BarTable t) {
        return new BarTableResponse(t.getId(), t.getTableNumber(), t.getCapacity(), t.getStatus(), t.getCreatedAt());
    }

    public BarOrderLineResponse toResponse(BarOrderLine l) {
        return new BarOrderLineResponse(
                l.getId(), l.getMenuItem().getId(), l.getItemNameSnapshot(), l.getQuantity(), l.getUnitPrice(),
                l.getTaxRate(), l.getDiscountAmount(), l.getTaxAmount(), l.getLineTotal(), l.isTaxInclusive(),
                l.isComped(), l.getNotes(), l.getStation(), l.getKitchenStatus());
    }

    public KdsLineResponse toKds(BarOrderLine l) {
        BarOrder o = l.getBarOrder();
        long elapsed = l.getSentAt() == null ? 0 : Math.max(0, Duration.between(l.getSentAt(), Instant.now(clock)).getSeconds());
        return new KdsLineResponse(
                l.getId(), o.getId(), o.getOrderNumber(),
                o.getTable() == null ? null : o.getTable().getTableNumber(),
                l.getItemNameSnapshot(), l.getQuantity(), l.getNotes(), name(l.getOrderedBy()),
                l.getStation(), l.getKitchenStatus(), l.getSentAt(), elapsed);
    }

    public BarPaymentResponse toResponse(BarPayment p) {
        return new BarPaymentResponse(
                p.getId(), p.getMethod(), p.getAmount(), p.getTendered(), p.getChangeGiven(),
                p.getReference(), name(p.getReceivedBy()), p.getCreatedAt());
    }

    public BarOrderResponse toResponse(BarOrder o) {
        return toResponse(o, Collections.emptyList());
    }

    public BarOrderResponse toResponse(BarOrder o, List<BarPayment> payments) {
        List<BarOrderLineResponse> items = o.getLines() == null
                ? Collections.emptyList()
                : o.getLines().stream().map(this::toResponse).toList();
        BigDecimal due = o.getTotal().subtract(o.getAmountPaid()).max(BigDecimal.ZERO);
        return new BarOrderResponse(
                o.getId(), o.getOrderNumber(),
                o.getTable() == null ? null : o.getTable().getId(),
                o.getTable() == null ? null : o.getTable().getTableNumber(),
                o.getMember() == null ? null : o.getMember().getId(),
                name(o.getMember()),
                o.getGuestName(), o.getStatus(),
                o.getMemberDiscountPercent(), o.getDiscountSource(), o.getMemberDiscountAmount(),
                o.getSubtotal(), o.getTaxTotal(), o.getTotal(), o.getAmountPaid(), due,
                o.getTab() == null ? null : o.getTab().getId(),
                items,
                payments.stream().map(this::toResponse).toList(),
                o.getCreatedAt());
    }

    public TabResponse toTabResponse(BarTab t, List<BarOrder> orders) {
        List<BarOrder> billable = orders.stream()
                .filter(o -> !BarStatus.VOID.equals(o.getStatus()) && !BarStatus.CANCELLED.equals(o.getStatus())).toList();
        BigDecimal total = billable.stream().map(BarOrder::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = billable.stream().map(BarOrder::getAmountPaid).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = billable.stream().filter(o -> BarStatus.ACTIVE.contains(o.getStatus()))
                .map(o -> o.getTotal().subtract(o.getAmountPaid()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new TabResponse(
                t.getId(),
                t.getMember() == null ? null : t.getMember().getId(),
                name(t.getMember()),
                t.getGuestName(),
                t.getTable() == null ? null : t.getTable().getId(),
                t.getTable() == null ? null : t.getTable().getTableNumber(),
                t.getStatus(), t.getOpenedAt(), t.getLimitAmount(), total, paid, outstanding,
                orders.stream().map(BarOrder::getId).toList());
    }

    public String name(Member m) {
        if (m == null) return null;
        String n = Stream.of(m.getFirstName(), m.getLastName()).filter(Objects::nonNull)
                .filter(s -> !s.isBlank()).collect(Collectors.joining(" "));
        return n.isBlank() ? null : n;
    }

    public String name(AppUser u) {
        if (u == null) return null;
        String n = Stream.of(u.getFirstName(), u.getLastName()).filter(Objects::nonNull)
                .filter(s -> !s.isBlank()).collect(Collectors.joining(" "));
        return n.isBlank() ? null : n;
    }
}