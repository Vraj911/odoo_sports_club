package com.bookmycourt.membership.service;

import com.bookmycourt.common.money.Money;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ProrationCalculatorTest {

    @Test
    void testUpgradeProration() {
        Money oldRate = Money.ofRupees(new BigDecimal("10.00")); // Rs 10 / day
        Money newRate = Money.ofRupees(new BigDecimal("25.00")); // Rs 25 / day
        int unusedDays = 30;

        var result = ProrationCalculator.compute(unusedDays, oldRate, newRate);

        assertEquals(30, result.unusedDays());
        assertEquals(Money.ofRupees(300), result.unusedCredit());
        assertEquals(Money.ofRupees(750), result.newCost());
        assertEquals(Money.ofRupees(450), result.difference()); // Customer owes 450
        assertTrue(result.difference().isPositive());
    }

    @Test
    void testDowngradeProration() {
        Money oldRate = Money.ofRupees(new BigDecimal("30.00"));
        Money newRate = Money.ofRupees(new BigDecimal("10.00"));
        int unusedDays = 20;

        var result = ProrationCalculator.compute(unusedDays, oldRate, newRate);

        assertEquals(20, result.unusedDays());
        assertEquals(Money.ofRupees(600), result.unusedCredit());
        assertEquals(Money.ofRupees(200), result.newCost());
        assertEquals(Money.ofRupees(-400), result.difference()); // Credit / refund 400
        assertTrue(result.difference().isNegative());
    }

    @Test
    void testZeroDaysProration() {
        var result = ProrationCalculator.compute(0, Money.ofRupees(10), Money.ofRupees(20));
        assertEquals(0, result.unusedDays());
        assertEquals(Money.ZERO, result.difference());
    }
}
