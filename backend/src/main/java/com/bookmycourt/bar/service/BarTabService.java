package com.bookmycourt.bar.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.bar.dto.OpenTabRequest;
import com.bookmycourt.bar.dto.TabResponse;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarTab;
import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.mapper.BarMapper;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarTabRepository;
import com.bookmycourt.bar.repository.BarTableRepository;
import com.bookmycourt.bar.event.BarTabMovedToAccount;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** BAR-06 / BAR-07 / BR-11: tabs - open, attach orders, enforce limit, move to member account. */
@Service
public class BarTabService {

    private final BarTabRepository tabs;
    private final BarOrderRepository orders;
    private final BarTableRepository tables;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final BarMapper mapper;
    private final BarDayLock dayLock;
    private final BarTableSupport tableSupport;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public BarTabService(BarTabRepository tabs, BarOrderRepository orders, BarTableRepository tables,
                         MemberRepository members, AppUserRepository users, BarMapper mapper,
                         BarDayLock dayLock, BarTableSupport tableSupport, AuditService audit,
                         ApplicationEventPublisher events, Clock clock) {
        this.tabs = tabs;
        this.orders = orders;
        this.tables = tables;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
        this.dayLock = dayLock;
        this.tableSupport = tableSupport;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public TabResponse openTab(OpenTabRequest r) {
        dayLock.assertOpenToday();
        Member member = null;
        if (r.memberId() != null) {
            member = members.findById(r.memberId()).orElseThrow(() -> new NotFoundException("Member not found"));
            if (tabs.existsByMember_IdAndStatus(member.getId(), BarStatus.TAB_OPEN)) {
                throw BarErrors.conflict("This member already has an open tab");
            }
        } else if (r.guestName() == null || r.guestName().isBlank()) {
            throw BarErrors.bad("Provide a memberId or a guestName for the tab");
        }
        BarTable table = r.tableId() == null ? null
                : tables.findById(r.tableId()).orElseThrow(() -> new NotFoundException("Table not found"));

        BarTab t = new BarTab();
        t.setMember(member);
        t.setGuestName(r.guestName() == null || r.guestName().isBlank() ? null : r.guestName().trim());
        t.setTable(table);
        t.setOpenedBy(currentUser());
        t.setLimitAmount(r.limitAmount());
        t.setOpenedAt(clock.instant());
        tabs.save(t);
        events.publishEvent(new BarEventHub.BarChanged("TAB_OPENED", null, table == null ? null : table.getId(), null));
        return toResponse(t);
    }

    @Transactional(readOnly = true)
    public List<TabResponse> listTabs(String status) {
        String s = status == null || status.isBlank() ? BarStatus.TAB_OPEN : status.trim().toUpperCase();
        return tabs.findByStatusOrderByOpenedAtAsc(s).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TabResponse getTab(UUID id) {
        return toResponse(tabs.findById(id).orElseThrow(() -> new NotFoundException("Tab not found")));
    }

    /** BAR-08: move an order onto a tab (items accrue across orders / tables). */
    @Transactional
    public TabResponse attachOrder(UUID tabId, UUID orderId) {
        BarTab tab = tabs.findByIdForUpdate(tabId).orElseThrow(() -> new NotFoundException("Tab not found"));
        requireOpen(tab);
        BarOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> new NotFoundException("Bar order not found"));
        if (!BarStatus.ACTIVE.contains(order.getStatus())) {
            throw BarErrors.conflict("Only unpaid orders can be put on a tab");
        }
        dayLock.assertOpen(dayLock.dayOf(order.getCreatedAt()));
        if (tab.getMember() != null && order.getMember() != null
                && !tab.getMember().getId().equals(order.getMember().getId())) {
            throw BarErrors.conflict("Order belongs to a different member than this tab");
        }
        order.setTab(tab);
        enforceLimit(tab, order);
        orders.save(order);
        events.publishEvent(new BarEventHub.BarChanged("TAB_UPDATED", order.getId(), null, null));
        return toResponse(tab);
    }

    /** BR-11 / AC-10: manager approval moves an unsettled member tab to the member's account (billed later). */
    @Transactional
    public TabResponse moveToAccount(UUID tabId, String reason) {
        BarTab tab = tabs.findByIdForUpdate(tabId).orElseThrow(() -> new NotFoundException("Tab not found"));
        requireOpen(tab);
        if (tab.getMember() == null) {
            throw BarErrors.conflict("Only a member's tab can be moved to an account; settle guest tabs before they leave");
        }
        TabResponse before = toResponse(tab);
        List<BarOrder> tabOrders = orders.findByTab_IdOrderByCreatedAtAsc(tabId);
        BigDecimal amount = BigDecimal.ZERO;
        List<UUID> moved = new java.util.ArrayList<>();
        Instant now = clock.instant();
        for (BarOrder o : tabOrders) {
            BarOrder locked = orders.findByIdForUpdate(o.getId()).orElse(o);
            if (!BarStatus.ACTIVE.contains(locked.getStatus())) continue;
            amount = amount.add(locked.getTotal().subtract(locked.getAmountPaid()));
            locked.setStatus(BarStatus.ON_ACCOUNT);
            locked.setClosedAt(now);
            orders.save(locked);
            tableSupport.releaseIfIdle(locked.getTable());
            moved.add(locked.getId());
        }
        tab.setStatus(BarStatus.TAB_MOVED);
        tab.setClosedAt(now);
        tab.setApprovedBy(currentUser());
        tab.setMoveReason(reason);
        tabs.save(tab);

        TabResponse after = toResponse(tab);
        audit.record("BAR_TAB_MOVED_TO_ACCOUNT", "BAR_TAB", tabId, before, after, reason);
        events.publishEvent(new BarTabMovedToAccount(tabId, tab.getMember().getId(), amount, moved));
        events.publishEvent(new BarEventHub.BarChanged("TAB_UPDATED", null, null, null));
        return after;
    }

    public void requireOpen(BarTab tab) {
        if (!BarStatus.TAB_OPEN.equals(tab.getStatus())) {
            throw BarErrors.conflict("Tab is " + tab.getStatus() + " and cannot take more orders");
        }
    }

    /** Optional tab limit (BAR-06). Managers can override. */
    public void enforceLimit(BarTab tab, BarOrder order) {
        if (tab.getLimitAmount() == null || BarRoles.isManager()) return;
        BigDecimal outstanding = orders.findByTab_IdOrderByCreatedAtAsc(tab.getId()).stream()
                .filter(o -> BarStatus.ACTIVE.contains(o.getStatus()) && !Objects.equals(o.getId(), order.getId()))
                .map(o -> o.getTotal().subtract(o.getAmountPaid()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(order.getTotal().subtract(order.getAmountPaid()));
        if (outstanding.compareTo(tab.getLimitAmount()) > 0) {
            throw BarErrors.conflict("Tab limit of " + tab.getLimitAmount() + " would be exceeded ("
                    + outstanding + "). Manager approval required.");
        }
    }

    TabResponse toResponse(BarTab t) {
        return mapper.toTabResponse(t, orders.findByTab_IdOrderByCreatedAtAsc(t.getId()));
    }

    private AppUser currentUser() {
        UUID id = audit.currentActorId();
        return id == null ? null : users.findById(id).orElse(null);
    }
}