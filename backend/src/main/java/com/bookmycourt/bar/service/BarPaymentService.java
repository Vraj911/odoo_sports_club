package com.bookmycourt.bar.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.PayOrderRequest;
import com.bookmycourt.bar.dto.PayOrderResponse;
import com.bookmycourt.bar.dto.PaymentLineRequest;
import com.bookmycourt.bar.dto.TabSettleResponse;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarPayment;
import com.bookmycourt.bar.entity.BarTab;
import com.bookmycourt.bar.entity.CashShift;
import com.bookmycourt.bar.mapper.BarMapper;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarPaymentRepository;
import com.bookmycourt.bar.repository.BarTabRepository;
import com.bookmycourt.bar.repository.CashShiftRepository;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * BAR-09: cash / card / UPI and split payments. THE ONLY way a bar order becomes PAID.
 * (Before, anyone could PATCH an order to PAID with no money recorded.)
 */
@Service
public class BarPaymentService {

    private record Norm(String method, BigDecimal amount, BigDecimal tendered, String reference) {
    }

    private final BarOrderRepository orders;
    private final BarPaymentRepository barPayments;
    private final BarTabRepository tabs;
    private final CashShiftRepository cashShifts;
    private final AppUserRepository users;
    private final BarMapper mapper;
    private final BarDayLock dayLock;
    private final BarTableSupport tableSupport;
    private final BarLedgerAdapter ledger;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public BarPaymentService(BarOrderRepository orders, BarPaymentRepository barPayments, BarTabRepository tabs,
                             CashShiftRepository cashShifts, AppUserRepository users, BarMapper mapper,
                             BarDayLock dayLock, BarTableSupport tableSupport, BarLedgerAdapter ledger,
                             AuditService audit, ApplicationEventPublisher events, Clock clock) {
        this.orders = orders;
        this.barPayments = barPayments;
        this.tabs = tabs;
        this.cashShifts = cashShifts;
        this.users = users;
        this.mapper = mapper;
        this.dayLock = dayLock;
        this.tableSupport = tableSupport;
        this.ledger = ledger;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public PayOrderResponse payOrder(UUID orderId, PayOrderRequest req) {
        BarOrder order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException("Bar order not found"));
        dayLock.assertOpen(dayLock.dayOf(order.getCreatedAt()));

        String key = blankToNull(req.idempotencyKey());
        if (key != null && barPayments.existsByBarOrder_IdAndIdempotencyKey(orderId, key)) {
            return new PayOrderResponse(view(order), BigDecimal.ZERO);   // replay: nothing is charged twice
        }
        if (!BarStatus.ACTIVE.contains(order.getStatus())) {
            throw BarErrors.conflict("Order " + order.getOrderNumber() + " is " + order.getStatus() + " and cannot be paid");
        }
        AppUser actor = requireActor();
        BigDecimal due = order.getTotal().subtract(order.getAmountPaid());
        List<Norm> lines = normalise(req.payments());

        if (lines.isEmpty()) {
            if (due.signum() == 0) {          // fully comped bill
                markPaid(order);
                orders.save(order);
                return new PayOrderResponse(view(order), BigDecimal.ZERO);
            }
            throw BarErrors.bad("At least one payment is required");
        }
        BigDecimal sum = lines.stream().map(Norm::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(due) > 0) {
            throw BarErrors.bad("Payments (" + sum + ") exceed the amount due (" + due + ")");
        }

        CashShift shift = cashShifts.findByStaffUser_IdAndStatus(actor.getId(), "OPEN").orElse(null);
        if (order.getCashShift() == null && shift != null) order.setCashShift(shift);

        BigDecimal change = BigDecimal.ZERO;
        for (Norm n : lines) {
            if ("CASH".equals(n.method()) && shift == null) {
                throw BarErrors.conflict("Open a cash shift before taking cash (BAR-11)");
            }
            BigDecimal changeGiven = "CASH".equals(n.method()) ? n.tendered().subtract(n.amount()) : BigDecimal.ZERO;
            recordOne(order, n.method(), n.amount(), n.tendered(), changeGiven, n.reference(), actor, shift, key);
            change = change.add(changeGiven);
        }
        order.setAmountPaid(order.getAmountPaid().add(sum));
        if (order.getAmountPaid().compareTo(order.getTotal()) >= 0) {
            markPaid(order);
        } else {
            order.setStatus(BarStatus.PARTIALLY_PAID);
        }
        orders.save(order);
        events.publishEvent(new BarEventHub.BarChanged("ORDER_PAYMENT", order.getId(),
                order.getTable() == null ? null : order.getTable().getId(), null));
        return new PayOrderResponse(view(order), change);
    }

    /** BAR-06: settle the whole tab before the member leaves. Payments must cover the outstanding amount exactly. */
    @Transactional
    public TabSettleResponse settleTab(UUID tabId, PayOrderRequest req) {
        BarTab tab = tabs.findByIdForUpdate(tabId).orElseThrow(() -> new NotFoundException("Tab not found"));
        String key = blankToNull(req.idempotencyKey());
        if (key != null && barPayments.existsByIdempotencyKey(key)) {
            return new TabSettleResponse(mapper.toTabResponse(tab, orders.findByTab_IdOrderByCreatedAtAsc(tabId)), BigDecimal.ZERO);
        }
        if (!BarStatus.TAB_OPEN.equals(tab.getStatus())) {
            throw BarErrors.conflict("Tab is " + tab.getStatus());
        }
        dayLock.assertOpenToday();
        AppUser actor = requireActor();

        List<BarOrder> active = new ArrayList<>();
        for (BarOrder o : orders.findByTab_IdOrderByCreatedAtAsc(tabId)) {
            BarOrder locked = orders.findByIdForUpdate(o.getId()).orElse(o);
            if (BarStatus.ACTIVE.contains(locked.getStatus())) active.add(locked);
        }
        active.sort(Comparator.comparing(BarOrder::getCreatedAt));
        BigDecimal due = active.stream().map(o -> o.getTotal().subtract(o.getAmountPaid()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Norm> lines = normalise(req.payments());
        BigDecimal sum = lines.stream().map(Norm::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(due) != 0) {
            throw BarErrors.bad("Tab settlement must equal the outstanding amount " + due + " (received " + sum + ")");
        }
        CashShift shift = cashShifts.findByStaffUser_IdAndStatus(actor.getId(), "OPEN").orElse(null);
        BigDecimal change = BigDecimal.ZERO;
        BigDecimal[] remaining = new BigDecimal[lines.size()];
        for (int i = 0; i < lines.size(); i++) {
            Norm n = lines.get(i);
            if ("CASH".equals(n.method())) {
                if (shift == null) throw BarErrors.conflict("Open a cash shift before taking cash (BAR-11)");
                change = change.add(n.tendered().subtract(n.amount()));
            }
            remaining[i] = n.amount();
        }
        for (BarOrder o : active) {
            BigDecimal d = o.getTotal().subtract(o.getAmountPaid());
            if (o.getCashShift() == null && shift != null) o.setCashShift(shift);
            for (int i = 0; i < lines.size() && d.signum() > 0; i++) {
                if (remaining[i].signum() == 0) continue;
                BigDecimal take = d.min(remaining[i]);
                Norm n = lines.get(i);
                recordOne(o, n.method(), take, take, BigDecimal.ZERO, n.reference(), actor, shift, key);
                remaining[i] = remaining[i].subtract(take);
                d = d.subtract(take);
                o.setAmountPaid(o.getAmountPaid().add(take));
            }
            markPaid(o);
            orders.save(o);
        }
        tab.setStatus(BarStatus.TAB_SETTLED);
        tab.setClosedAt(clock.instant());
        tabs.save(tab);
        events.publishEvent(new BarEventHub.BarChanged("TAB_UPDATED", null, null, null));
        return new TabSettleResponse(mapper.toTabResponse(tab, orders.findByTab_IdOrderByCreatedAtAsc(tabId)), change);
    }

    // ------------------------------------------------------------------ helpers

    private void recordOne(BarOrder order, String method, BigDecimal amount, BigDecimal tendered, BigDecimal change,
                           String reference, AppUser actor, CashShift shift, String key) {
        BarPayment p = new BarPayment();
        p.setBarOrder(order);
        p.setMethod(method);
        p.setAmount(amount);
        p.setTendered(tendered);
        p.setChangeGiven(change);
        p.setReference(reference);
        p.setReceivedBy(actor);
        p.setCashShift(shift);
        p.setIdempotencyKey(key);
        p.setLedgerPaymentId(ledger.record(order, method, amount, reference, shift));
        barPayments.save(p);
    }

    private void markPaid(BarOrder order) {
        order.setStatus(BarStatus.PAID);
        order.setClosedAt(clock.instant());
        tableSupport.releaseIfIdle(order.getTable());
        BarTab tab = order.getTab();
        if (tab != null && BarStatus.TAB_OPEN.equals(tab.getStatus())
                && !orders.existsByTab_IdAndStatusIn(tab.getId(), BarStatus.ACTIVE)) {
            tab.setStatus(BarStatus.TAB_SETTLED);
            tab.setClosedAt(clock.instant());
            tabs.save(tab);
        }
    }

    private List<Norm> normalise(List<PaymentLineRequest> in) {
        List<Norm> out = new ArrayList<>();
        if (in == null) return out;
        for (PaymentLineRequest l : in) {
            String m = l.method() == null ? "" : l.method().trim().toUpperCase(Locale.ROOT);
            if (!BarStatus.METHODS.contains(m)) throw BarErrors.bad("Payment method must be CASH, CARD or UPI");
            BigDecimal amount = l.amount().setScale(2, RoundingMode.HALF_UP);
            String ref = blankToNull(l.reference());
            if (!"CASH".equals(m) && ref == null) {
                throw BarErrors.bad(m + " payments need a reference (gateway / terminal / UTR number)");
            }
            BigDecimal tendered = "CASH".equals(m) && l.tendered() != null
                    ? l.tendered().setScale(2, RoundingMode.HALF_UP) : amount;
            if (tendered.compareTo(amount) < 0) throw BarErrors.bad("Tendered amount is less than the payment amount");
            out.add(new Norm(m, amount, tendered, ref));
        }
        return out;
    }

    private BarOrderResponse view(BarOrder order) {
        return mapper.toResponse(order, barPayments.findByBarOrder_IdOrderByCreatedAtAsc(order.getId()));
    }

    private AppUser requireActor() {
        UUID id = audit.currentActorId();
        AppUser u = id == null ? null : users.findById(id).orElse(null);
        if (u == null) {
            throw BarErrors.bad("Cannot determine the current staff user - make sure you are logged in");
        }
        return u;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}