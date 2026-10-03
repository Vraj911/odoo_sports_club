package com.bookmycourt.common.money;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class TaxCalculator {

    private TaxCalculator() {
    }

    public record TaxBreakup(Money net, Money tax, Money gross) {
    }

    public record GstSplit(Money cgst, Money sgst, Money igst) {
    }

    public static TaxBreakup exclusive(Money net, BigDecimal ratePercent) {
        if (net == null) {
            net = Money.ZERO;
        }
        Money tax = net.percent(ratePercent);
        Money gross = net.plus(tax);
        return new TaxBreakup(net, tax, gross);
    }

    public static TaxBreakup inclusive(Money gross, BigDecimal ratePercent) {
        if (gross == null) {
            gross = Money.ZERO;
        }
        if (ratePercent == null || ratePercent.signum() == 0 || gross.isZero()) {
            return new TaxBreakup(gross, Money.ZERO, gross);
        }

        BigDecimal grossPaise = BigDecimal.valueOf(gross.paise());
        BigDecimal netPaise = grossPaise.multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(100).add(ratePercent), 0, RoundingMode.HALF_UP);
        Money net = Money.ofPaise(netPaise.longValueExact());
        Money tax = gross.minus(net); // Ensures net + tax == gross exactly
        return new TaxBreakup(net, tax, gross);
    }

    public static GstSplit splitGst(Money tax, boolean intraState) {
        if (tax == null || tax.isZero()) {
            return new GstSplit(Money.ZERO, Money.ZERO, Money.ZERO);
        }
        if (intraState) {
            List<Money> halves = tax.allocate(1, 1);
            return new GstSplit(halves.get(0), halves.get(1), Money.ZERO);
        } else {
            return new GstSplit(Money.ZERO, Money.ZERO, tax);
        }
    }
}
