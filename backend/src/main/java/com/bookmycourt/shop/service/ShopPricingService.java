package com.bookmycourt.shop.service;

import com.bookmycourt.shop.entity.ShopOrder;
import com.bookmycourt.shop.entity.ShopOrderLine;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * SHP-06 / BR-09 / FIN-07: member discount per line + GST (inclusive or exclusive).
 * Invariant: total = subtotal - discountTotal + taxTotal + deliveryFee
 */
@Component
public class ShopPricingService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    public void recalculate(ShopOrder order) {
        BigDecimal pct = nz(order.getDiscountPercent());
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal linesTotal = BigDecimal.ZERO;

        for (ShopOrderLine l : order.getLines()) {
            BigDecimal gross = money(l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQuantity())));
            BigDecimal discount = money(gross.multiply(pct).divide(HUNDRED, 4, RoundingMode.HALF_UP));
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
            l.setDiscountPercent(pct);
            l.setDiscountAmount(discount);
            l.setTaxAmount(tax);
            l.setLineTotal(lineTotal);

            subtotal = subtotal.add(lineTotal.subtract(tax).add(discount));
            discountTotal = discountTotal.add(discount);
            taxTotal = taxTotal.add(tax);
            linesTotal = linesTotal.add(lineTotal);
        }
        order.setSubtotal(subtotal);
        order.setDiscountTotal(discountTotal);
        order.setTaxTotal(taxTotal);
        order.setTotal(linesTotal.add(nz(order.getDeliveryFee())));
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
