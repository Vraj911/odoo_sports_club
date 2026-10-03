package com.bookmycourt.dashboard.service;

import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.crm.repository.LeadRepository;
import com.bookmycourt.dashboard.dto.DashboardStatsResponse;
import com.bookmycourt.finance.repository.ExpenseRepository;
import com.bookmycourt.finance.repository.InvoiceRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final BookingRepository bookings;
    private final BarOrderRepository barOrders;
    private final ProductVariantRepository variants;
    private final LeadRepository leads;
    private final InvoiceRepository invoices;
    private final ExpenseRepository expenses;
    private final PaymentRepository payments;

    public DashboardService(
            MemberRepository members,
            MembershipRepository memberships,
            BookingRepository bookings,
            BarOrderRepository barOrders,
            ProductVariantRepository variants,
            LeadRepository leads,
            InvoiceRepository invoices,
            ExpenseRepository expenses,
            PaymentRepository payments) {
        this.members = members;
        this.memberships = memberships;
        this.bookings = bookings;
        this.barOrders = barOrders;
        this.variants = variants;
        this.leads = leads;
        this.invoices = invoices;
        this.expenses = expenses;
        this.payments = payments;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalMembers = members.count();
        long activeMemberships = memberships.findAll().stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) || "EXPIRING_SOON".equalsIgnoreCase(m.getStatus()))
                .count();

        ZoneId clubZone = ZoneId.of("Asia/Kolkata");
        OffsetDateTime startOfDay = LocalDate.now(clubZone).atStartOfDay(clubZone).toOffsetDateTime();
        OffsetDateTime endOfDay = startOfDay.plusDays(1);

        long bookingsToday = bookings.findAll().stream()
                .filter(b -> !b.getStartTime().isBefore(startOfDay) && b.getStartTime().isBefore(endOfDay))
                .count();
        long totalBookings = bookings.count();

        long openBarOrders = barOrders.findByStatusIn(List.of("OPEN", "SENT", "PARTIALLY_PAID")).size();
        BigDecimal todayBarRevenue = barOrders.findAll().stream()
                .filter(o -> !o.getCreatedAt().isBefore(startOfDay.toInstant()) && "PAID".equalsIgnoreCase(o.getStatus()))
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long lowStockCount = variants.findLowStock().size();

        long openLeads = leads.findAll().stream()
                .filter(l -> !"WON".equalsIgnoreCase(l.getStatus()) && !"LOST".equalsIgnoreCase(l.getStatus()))
                .count();
        long wonLeads = leads.findByStatus("WON").size();

        BigDecimal totalRevenue = payments.findAll().stream()
                .filter(p -> "PAID".equalsIgnoreCase(p.getStatus()))
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenses.findAll().stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = totalRevenue.subtract(totalExpenses);

        Map<String, Object> extra = new HashMap<>();
        extra.put("unpaidInvoicesCount", invoices.findByStatus("DRAFT").size() + invoices.findByStatus("SENT").size());
        extra.put("totalVariantsCount", variants.count());

        return new DashboardStatsResponse(
                totalMembers,
                activeMemberships,
                bookingsToday,
                totalBookings,
                openBarOrders,
                todayBarRevenue,
                lowStockCount,
                openLeads,
                wonLeads,
                totalRevenue,
                totalExpenses,
                netProfit,
                extra
        );
    }
}
