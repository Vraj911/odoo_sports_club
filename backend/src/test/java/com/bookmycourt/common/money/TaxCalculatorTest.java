package com.bookmycourt.common.money;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class TaxCalculatorTest {

    @Test
    void testExclusiveTax() {
        Money net = Money.ofRupees(1000); // Rs 1000.00
        var breakup = TaxCalculator.exclusive(net, new BigDecimal("18.00"));

        assertEquals(Money.ofRupees(1000), breakup.net());
        assertEquals(Money.ofRupees(180), breakup.tax());
        assertEquals(Money.ofRupees(1180), breakup.gross());
    }

    @Test
    void testInclusiveTax() {
        Money gross = Money.ofRupees(1180); // Rs 1180.00 inclusive of 18%
        var breakup = TaxCalculator.inclusive(gross, new BigDecimal("18.00"));

        assertEquals(Money.ofRupees(1000), breakup.net());
        assertEquals(Money.ofRupees(180), breakup.tax());
        assertEquals(gross, breakup.gross());
        assertEquals(gross, breakup.net().plus(breakup.tax()));
    }

    @Test
    void testGstSplit() {
        Money tax = Money.ofPaise(1800); // Rs 18.00
        // Intra-state split: CGST 9.00, SGST 9.00, IGST 0.00
        var intra = TaxCalculator.splitGst(tax, true);
        assertEquals(Money.ofPaise(900), intra.cgst());
        assertEquals(Money.ofPaise(900), intra.sgst());
        assertEquals(Money.ZERO, intra.igst());

        // Inter-state split: CGST 0.00, SGST 0.00, IGST 18.00
        var inter = TaxCalculator.splitGst(tax, false);
        assertEquals(Money.ZERO, inter.cgst());
        assertEquals(Money.ZERO, inter.sgst());
        assertEquals(tax, inter.igst());

        // Odd amount split (1 paisa allocated to CGST)
        Money oddTax = Money.ofPaise(99);
        var oddSplit = TaxCalculator.splitGst(oddTax, true);
        assertEquals(Money.ofPaise(50), oddSplit.cgst());
        assertEquals(Money.ofPaise(49), oddSplit.sgst());
        assertEquals(oddTax, oddSplit.cgst().plus(oddSplit.sgst()));
    }
}
