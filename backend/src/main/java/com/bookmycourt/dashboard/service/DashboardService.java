package com.bookmycourt.dashboard.service;

import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.crm.repository.LeadRepository;
import com.bookmycourt.dashboard.dto.DashboardStatsResponse;
import com.bookmycourt.dashboard.dto.DashboardStatsResponse.Kpis;
import com.bookmycourt.dashboard.dto.DashboardStatsResponse.Period;
import com.bookmycourt.finance.repository.ExpenseRepository;
import com.bookmycourt.finance.repository.InvoiceRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

@Service
public class DashboardService {

    private static final List<String> LIVE = List.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW");
    private static final List<String> ACTIVE_MEMBERSHIP = List.of("ACTIVE", "EXPIRING_SOON");

    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final BookingRepository bookings;
    private final BarOrderRepository barOrders;
    private final ProductVariantRepository variants;
    private final LeadRepository leads;
    private final InvoiceRepository invoices;
    private final ExpenseRepository expenses;
    private final PaymentRepository payments;
    private final Clock clock;

    public DashboardService(
            MemberRepository members,
            MembershipRepository memberships,
            BookingRepository bookings,
            BarOrderRepository barOrders,
            ProductVariantRepository variants,
            LeadRepository leads,
            InvoiceRepository invoices,
            ExpenseRepository expenses,
            PaymentRepository payments,
            Clock clock) {
        this.members = members;
        this.memberships = memberships;
        this.bookings = bookings;
        this.barOrders = barOrders;
        this.variants = variants;
        this.leads = leads;
        this.invoices = invoices;
        this.expenses = expenses;
        this.payments = payments;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(String rangeRaw) {
        Actor actor = ActorHolder.current();
        if (actor == null || !actor.isManagerOrAbove()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "Dashboard is restricted to owner/manager");
        }

        String range = rangeRaw == null ? "today" : rangeRaw.trim().toLowerCase(Locale.ROOT);
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));

        LocalDate from;
        LocalDate toExcl;
        LocalDate prevFrom;
        switch (range) {
            case "today" -> {
                from = today;
                toExcl = today.plusDays(1);
                prevFrom = today.minusDays(1);
            }
            case "week" -> {
                from = today.with(DayOfWeek.MONDAY);
                toExcl = from.plusWeeks(1);
                prevFrom = from.minusWeeks(1);
            }
            case "month" -> {
                from = today.withDayOfMonth(1);
                toExcl = from.plusMonths(1);
                prevFrom = from.minusMonths(1);
            }
            default ->
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "range must be today, week or month");
        }

        Kpis current = kpis(from, toExcl);
        Kpis previous = kpis(prevFrom, from);

        // ---- all-time / live figures, all via COUNT/SUM queries (no findAll) ----
        long totalMembers = members.count();
        long activeMemberships = memberships.countByStatusIn(ACTIVE_MEMBERSHIP);

        OffsetDateTime dayStart = today.atStartOfDay(ClubTime.IST).toOffsetDateTime();
        long bookingsToday = bookings.countInRange(dayStart, dayStart.plusDays(1), LIVE);
        long totalBookings = bookings.count();

        long openBarOrders = barOrders.findByStatusIn(List.of("OPEN", "SENT", "PARTIALLY_PAID")).size();
        BigDecimal todayBarRevenue = barOrders.sumPaidBetween(
                today.atStartOfDay(ClubTime.IST).toInstant(), today.plusDays(1).atStartOfDay(ClubTime.IST).toInstant());

        long lowStock = variants.findLowStock().size();

        long won = leads.countByStatus("WON");
        long lost = leads.countByStatus("LOST");
        long openLeads = Math.max(0, leads.count() - won - lost);

        BigDecimal totalRevenue = payments.sumPaid();
        BigDecimal totalExpenses = expenses.sumAll();

        Map<String, Object> extra = new HashMap<>();
        extra.put("unpaidInvoicesCount", invoices.countByStatusIn(List.of("SENT", "PARTIAL", "OVERDUE")));
        extra.put("receivablesOutstanding", invoices.outstandingReceivables());
        extra.put("membershipsExpiringIn30Days",
                memberships.countByStatusInAndEndDateBetween(ACTIVE_MEMBERSHIP, today, today.plusDays(30)));
        extra.put("totalVariantsCount", variants.count());

        return new DashboardStatsResponse(
                totalMembers, activeMemberships, bookingsToday, totalBookings,
                openBarOrders, todayBarRevenue, lowStock, openLeads, won,
                totalRevenue, totalExpenses, totalRevenue.subtract(totalExpenses), extra,
                range, new Period(from, toExcl.minusDays(1)), current, previous);
    }

    private Kpis kpis(LocalDate from, LocalDate toExcl) {
        Instant f = from.atStartOfDay(ClubTime.IST).toInstant();
        Instant t = toExcl.atStartOfDay(ClubTime.IST).toInstant();
        OffsetDateTime of = from.atStartOfDay(ClubTime.IST).toOffsetDateTime();
        OffsetDateTime ot = toExcl.atStartOfDay(ClubTime.IST).toOffsetDateTime();

        Map<String, BigDecimal> bySource = new TreeMap<>();
        Map<String, BigDecimal> byMethod = new TreeMap<>();
        BigDecimal revenue = BigDecimal.ZERO;
        for (Object[] row : payments.revenueBreakdown(f, t)) {
            String source = row[0] == null ? "OTHER" : row[0].toString();
            String method = row[1] == null ? "OTHER" : row[1].toString();
            BigDecimal amt = (BigDecimal) row[2];
            bySource.merge(source, amt, BigDecimal::add);
            byMethod.merge(method, amt, BigDecimal::add);
            revenue = revenue.add(amt);
        }

        BigDecimal exp = expenses.sumBetween(f, t);

        long live = bookings.countInRange(of, ot, LIVE);           // everything except cancelled/expired
        long cancelled = bookings.countInRange(of, ot, List.of("CANCELLED"));
        long noShow = bookings.countInRange(of, ot, List.of("NO_SHOW"));
        double cancelRate = (live + cancelled) == 0 ? 0.0 : (double) cancelled / (live + cancelled);
        double noShowRate = live == 0 ? 0.0 : (double) noShow / live;

        return new Kpis(revenue, bySource, byMethod, exp, revenue.subtract(exp),
                live, cancelled, noShow, cancelRate, noShowRate);
    }
}
