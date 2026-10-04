package com.bookmycourt.bar.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.bar.dto.DailyReportResponse;
import com.bookmycourt.bar.dto.TabResponse;
import com.bookmycourt.bar.entity.BarDayClose;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarOrderLine;
import com.bookmycourt.bar.entity.BarPayment;
import com.bookmycourt.bar.mapper.BarMapper;
import com.bookmycourt.bar.repository.BarDayCloseRepository;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarPaymentRepository;
import com.bookmycourt.bar.repository.CashShiftRepository;
import com.bookmycourt.membership.repository.AppUserRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

/** BAR-13: daily closing (Z-report) - what the bar actually earned that day. Closing locks the day (BR-14). */
@Service
public class BarReportService {

    private final BarOrderRepository orders;
    private final BarPaymentRepository barPayments;
    private final BarDayCloseRepository closes;
    private final CashShiftRepository cashShifts;
    private final AppUserRepository users;
    private final BarTabService tabService;
    private final BarMapper mapper;
    private final BarDayLock dayLock;
    private final AuditService audit;
    private final ObjectMapper json;
    private final Clock clock;

    public BarReportService(BarOrderRepository orders, BarPaymentRepository barPayments, BarDayCloseRepository closes,
                            CashShiftRepository cashShifts, AppUserRepository users, BarTabService tabService,
                            BarMapper mapper, BarDayLock dayLock, AuditService audit, ObjectMapper json, Clock clock) {
        this.orders = orders;
        this.barPayments = barPayments;
        this.closes = closes;
        this.cashShifts = cashShifts;
        this.users = users;
        this.tabService = tabService;
        this.mapper = mapper;
        this.dayLock = dayLock;
        this.audit = audit;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DailyReportResponse preview(LocalDate date) {
        return compute(date);
    }

    @Transactional
    public DailyReportResponse close(LocalDate date) {
        if (date.isAfter(dayLock.today())) throw BarErrors.bad("Cannot close a future day");
        if (dayLock.isClosed(date)) throw BarErrors.conflict("Day " + date + " is already closed");

        DailyReportResponse report = compute(date);
        if (!report.openTabs().isEmpty() || report.unpaidOrders() > 0 || report.openShifts() > 0) {
            throw BarErrors.conflict("Cannot close " + date + ": " + report.openTabs().size() + " open tab(s), "
                    + report.unpaidOrders() + " unpaid order(s), " + report.openShifts()
                    + " open cash shift(s). Settle tabs (or move them to account with manager approval) first.");
        }
        BarDayClose c = closes.findByBusinessDate(date).orElseGet(BarDayClose::new);
        c.setBusinessDate(date);
        c.setStatus("CLOSED");
        c.setClosedBy(currentUser());
        c.setClosedAt(clock.instant());
        c.setSnapshot(json.convertValue(report, new TypeReference<Map<String, Object>>() {
        }));
        closes.save(c);
        audit.record("BAR_DAY_CLOSED", "BAR_DAY", c.getId(), null, report);
        return compute(date);
    }

    @Transactional
    public DailyReportResponse reopen(LocalDate date, String reason) {
        BarDayClose c = closes.findByBusinessDate(date)
                .filter(x -> "CLOSED".equals(x.getStatus()))
                .orElseThrow(() -> BarErrors.conflict("Day " + date + " is not closed"));
        c.setStatus("REOPENED");
        c.setReopenedBy(currentUser());
        c.setReopenedAt(clock.instant());
        c.setReopenReason(reason);
        closes.save(c);
        audit.record("BAR_DAY_REOPENED", "BAR_DAY", c.getId(), null, Map.of("date", date.toString()), reason);
        return compute(date);
    }

    private DailyReportResponse compute(LocalDate date) {
        Instant from = date.atStartOfDay(BarDayLock.IST).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(BarDayLock.IST).toInstant();

        List<BarOrder> sales = orders.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(from, to).stream()
                .filter(o -> !BarStatus.VOID.equals(o.getStatus()) && !BarStatus.CANCELLED.equals(o.getStatus()))
                .toList();

        BigDecimal gross = BigDecimal.ZERO, discounts = BigDecimal.ZERO, tax = BigDecimal.ZERO, net = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new TreeMap<>();
        Map<String, BigDecimal> byStaff = new TreeMap<>();
        for (BarOrder o : sales) {
            gross = gross.add(o.getSubtotal());
            discounts = discounts.add(o.getMemberDiscountAmount());
            tax = tax.add(o.getTaxTotal());
            net = net.add(o.getTotal());
            String staff = o.getOpenedBy() == null ? "Unattributed" : orDefault(mapper.name(o.getOpenedBy()), "Staff");
            byStaff.merge(staff, o.getTotal(), BigDecimal::add);
            for (BarOrderLine l : o.getLines()) {
                if (BarStatus.LINE_VOID.equals(l.getKitchenStatus())) continue;
                byCategory.merge(l.getMenuItem().getCategory(), l.getLineTotal(), BigDecimal::add);
            }
        }
        Map<String, BigDecimal> byMethod = new TreeMap<>();
        for (BarPayment p : barPayments.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(from, to)) {
            byMethod.merge(p.getMethod(), p.getAmount(), BigDecimal::add);
        }
        List<TabResponse> openTabs = tabService.listTabs(BarStatus.TAB_OPEN).stream()
                .filter(t -> t.openedAt() != null && t.openedAt().isBefore(to)).toList();
        long unpaid = orders.findByStatusIn(BarStatus.ACTIVE).stream().filter(o -> o.getCreatedAt().isBefore(to)).count();
        long openShifts = cashShifts.findByStatusOrderByOpenedAtDesc("OPEN").size();

        BarDayClose c = closes.findByBusinessDate(date).orElse(null);
        boolean closed = c != null && "CLOSED".equals(c.getStatus());
        return new DailyReportResponse(date, closed, closed ? c.getClosedAt() : null, sales.size(), gross, discounts,
                tax, net, byMethod, byCategory, byStaff, openTabs, unpaid, openShifts);
    }

    private com.bookmycourt.membership.entity.AppUser currentUser() {
        UUID id = audit.currentActorId();
        return id == null ? null : users.findById(id).orElse(null);
    }

    private static String orDefault(String s, String d) {
        return s == null || s.isBlank() ? d : s;
    }
}