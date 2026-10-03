package com.bookmycourt.bar.service;

import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarOrderLine;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * BAR-05 / BAR-10 / BR-09: line-level member discount + GST (inclusive or exclusive per item).
 * Invariant kept for every order:  total = subtotal - memberDiscountAmount + taxTotal
 */
@Component
public class BarPricingService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    public void recalculate(BarOrder order) {
        BigDecimal pct = nz(order.getMemberDiscountPercent());
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;

        for (BarOrderLine l : order.getLines()) {
            if (BarStatus.LINE_VOID.equals(l.getKitchenStatus())) {
                l.setDiscountAmount(BigDecimal.ZERO);
                l.setTaxAmount(BigDecimal.ZERO);
                l.setLineTotal(BigDecimal.ZERO);
                continue;
            }
            BigDecimal gross = money(l.getUnitPrice().multiply(l.getQuantity()));
            BigDecimal discount = l.isComped() ? gross : money(gross.multiply(pct).divide(HUNDRED, 4, RoundingMode.HALF_UP));
            BigDecimal net = gross.subtract(discount);
            BigDecimal rate = nz(l.getTaxRate());

            BigDecimal tax;
            BigDecimal lineTotal;
            if (l.isTaxInclusive()) {
                BigDecimal taxable = net.multiply(HUNDRED).divide(HUNDRED.add(rate), 2, RoundingMode.HALF_UP);
                tax = net.subtract(taxable);
                lineTotal = net;
            } else {
                tax = money(net.multiply(rate).divide(HUNDRED, 4, RoundingMode.HALF_UP));
                lineTotal = net.add(tax);
            }
            l.setDiscountAmount(discount);
            l.setTaxAmount(tax);
            l.setLineTotal(lineTotal);

            subtotal = subtotal.add(lineTotal.subtract(tax).add(discount));
            discountTotal = discountTotal.add(discount);
            taxTotal = taxTotal.add(tax);
            total = total.add(lineTotal);
        }
        order.setSubtotal(subtotal);
        order.setMemberDiscountAmount(discountTotal);
        order.setTaxTotal(taxTotal);
        order.setTotal(total);
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}