package com.bookmycourt.crm.service;

import com.bookmycourt.crm.dto.QuoteLineRequest;
import com.bookmycourt.crm.exception.CrmException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/** Pure quote maths. Rounds per line (HALF_UP, 2 decimals); the total is the sum of rounded line totals. */
public final class QuoteCalculator {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private QuoteCalculator() {
    }

    public record Line(String description, BigDecimal quantity, BigDecimal unitPrice, BigDecimal taxPercent,
                       BigDecimal net, BigDecimal tax, BigDecimal lineTotal) {
    }

    public record Result(List<Line> lines, BigDecimal subtotal, BigDecimal taxTotal, BigDecimal total) {
    }

    public static Result calculate(List<QuoteLineRequest> input) {
        if (input == null || input.isEmpty()) {
            throw CrmException.badRequest("VALIDATION_FAILED", "A quote needs at least one line");
        }
        List<Line> lines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        for (QuoteLineRequest l : input) {
            if (l.quantity() == null || l.quantity().signum() <= 0) {
                throw CrmException.badRequest("VALIDATION_FAILED", "Quantity must be greater than zero");
            }
            if (l.unitPrice() == null || l.unitPrice().signum() < 0) {
                throw CrmException.badRequest("VALIDATION_FAILED", "Unit price cannot be negative");
            }
            BigDecimal taxPct = l.taxPercent() == null ? BigDecimal.ZERO : l.taxPercent();
            if (taxPct.signum() < 0 || taxPct.compareTo(HUNDRED) > 0) {
                throw CrmException.badRequest("VALIDATION_FAILED", "Tax percent must be between 0 and 100");
            }
            BigDecimal net = l.quantity().multiply(l.unitPrice()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tax = net.multiply(taxPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);
            BigDecimal total = net.add(tax);
            lines.add(new Line(l.description().trim(), l.quantity(), l.unitPrice(), taxPct, net, tax, total));
            subtotal = subtotal.add(net);
            taxTotal = taxTotal.add(tax);
        }
        return new Result(lines, subtotal, taxTotal, subtotal.add(taxTotal));
    }
}
