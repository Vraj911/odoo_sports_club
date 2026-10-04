package com.bookmycourt.shop.service;

import com.bookmycourt.shop.dto.InventorySummaryResponse;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.ShopSalesReportResponse;
import com.bookmycourt.shop.entity.ProductVariant;
import com.bookmycourt.shop.entity.ShopOrder;
import com.bookmycourt.shop.entity.ShopOrderLine;
import com.bookmycourt.shop.mapper.ShopMapper;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import com.bookmycourt.shop.repository.ShopOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** SHP-16 shop sales reports, dead stock, RPT-04 inventory KPIs. Days are Asia/Kolkata (NFR-13). */
@Service
public class ShopReportService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final ShopOrderRepository orders;
    private final ProductVariantRepository variants;
    private final ShopMapper mapper;
    private final Clock clock;

    public ShopReportService(ShopOrderRepository orders, ProductVariantRepository variants,
                             ShopMapper mapper, Clock clock) {
        this.orders = orders;
        this.variants = variants;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ShopSalesReportResponse sales(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) throw ShopErrors.bad("'to' cannot be before 'from'");
        Instant start = from.atStartOfDay(IST).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(IST).toInstant();

        List<ShopOrder> sold = orders.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end).stream()
                .filter(o -> ShopStatus.SOLD.contains(o.getStatus())).toList();

        BigDecimal gross = BigDecimal.ZERO, discounts = BigDecimal.ZERO, tax = BigDecimal.ZERO;
        BigDecimal fees = BigDecimal.ZERO, net = BigDecimal.ZERO, refunds = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new TreeMap<>();
        Map<String, BigDecimal> byChannel = new TreeMap<>();
        Map<String, BigDecimal> byStaff = new TreeMap<>();
        Map<String, ShopSalesReportResponse.ProductSales> byVariant = new HashMap<>();

        for (ShopOrder o : sold) {
            gross = gross.add(o.getSubtotal());
            discounts = discounts.add(o.getDiscountTotal());
            tax = tax.add(o.getTaxTotal());
            fees = fees.add(o.getDeliveryFee());
            net = net.add(o.getTotal());
            refunds = refunds.add(o.getRefundedTotal());
            byChannel.merge(o.getChannel(), o.getTotal(), BigDecimal::add);
            String staff = "Unattributed";
            if (o.getCreatedBy() != null) {
                String n = ((o.getCreatedBy().getFirstName() == null ? "" : o.getCreatedBy().getFirstName()) + " "
                        + (o.getCreatedBy().getLastName() == null ? "" : o.getCreatedBy().getLastName())).trim();
                staff = n.isBlank() ? "Staff" : n;
            }
            byStaff.merge(staff, o.getTotal(), BigDecimal::add);

            for (ShopOrderLine l : o.getLines()) {
                int netQty = l.getQuantity() - l.getReturnedQuantity();
                if (netQty <= 0) continue;
                BigDecimal rev = l.getLineTotal().multiply(BigDecimal.valueOf(netQty))
                        .divide(BigDecimal.valueOf(l.getQuantity()), 2, java.math.RoundingMode.HALF_UP);
                byCategory.merge(l.getProductVariant().getProduct().getCategory(), rev, BigDecimal::add);
                byVariant.merge(l.getSkuSnapshot(),
                        new ShopSalesReportResponse.ProductSales(l.getProductNameSnapshot(), l.getVariantNameSnapshot(),
                                l.getSkuSnapshot(), netQty, rev),
                        (a, b) -> new ShopSalesReportResponse.ProductSales(a.productName(), a.variantName(), a.sku(),
                                a.quantity() + b.quantity(), a.revenue().add(b.revenue())));
            }
        }
        List<ShopSalesReportResponse.ProductSales> best = byVariant.values().stream()
                .sorted(Comparator.comparingInt(ShopSalesReportResponse.ProductSales::quantity).reversed())
                .limit(10).toList();
        return new ShopSalesReportResponse(from, to, sold.size(), gross, discounts, tax, fees, net, refunds,
                net.subtract(refunds), byCategory, byChannel, byStaff, best);
    }

    /** Stock sitting on the shelf with no sale in the last `days` days. */
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> deadStock(int days) {
        int d = Math.min(Math.max(days, 7), 730);
        Instant cutoff = clock.instant().minus(d, ChronoUnit.DAYS);
        return variants.findDeadStock(cutoff).stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse inventorySummary() {
        List<ProductVariant> active = variants.findAll().stream().filter(ProductVariant::isActive).toList();
        BigDecimal value = active.stream()
                .map(v -> v.getPrice().multiply(BigDecimal.valueOf(v.getOnHand())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new InventorySummaryResponse(
                variants.countActive(),
                variants.findLowStock().size(),
                variants.countOutOfStock(),
                value,
                orders.countByStatusIn(ShopStatus.HOLDS_RESERVATION));
    }
}
