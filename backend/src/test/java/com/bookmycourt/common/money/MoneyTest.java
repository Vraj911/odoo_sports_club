package com.bookmycourt.common.money;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MoneyTest {

    @Test
    void testBasicRupeesAndPaise() {
        Money m = Money.ofRupees(new BigDecimal("123.45"));
        assertEquals(12345L, m.paise());
        assertEquals(new BigDecimal("123.45"), m.toRupees());
        assertEquals("Rs 123.45", m.toString());

        Money zero = Money.ofRupees(BigDecimal.ZERO);
        assertTrue(zero.isZero());
        assertFalse(m.isZero());
        assertTrue(m.isPositive());
    }

    @Test
    void testArithmetic() {
        Money a = Money.ofPaise(1000);
        Money b = Money.ofPaise(350);

        assertEquals(Money.ofPaise(1350), a.plus(b));
        assertEquals(Money.ofPaise(650), a.minus(b));
        assertEquals(Money.ofPaise(3000), a.times(3));
        assertEquals(Money.ofPaise(-1000), a.negate());
        assertTrue(a.negate().isNegative());
    }

    @Test
    void testPercent() {
        Money total = Money.ofPaise(1000); // Rs 10.00
        Money tax18 = total.percent(new BigDecimal("18.00")); // 18% = 180 paise
        assertEquals(Money.ofPaise(180), tax18);

        // Test rounding
        Money odd = Money.ofPaise(333);
        Money taxHalfUp = odd.percent(new BigDecimal("10.00")); // 33.3 -> 33
        assertEquals(Money.ofPaise(33), taxHalfUp);
    }

    @Test
    void testLargestRemainderAllocation() {
        Money hundred = Money.ofPaise(100);
        // Split 100 paise 3 ways equally: 33, 33, 34 (largest remainder to first)
        List<Money> parts = hundred.allocate(1, 1, 1);
        assertEquals(3, parts.size());
        assertEquals(Money.ofPaise(34), parts.get(0));
        assertEquals(Money.ofPaise(33), parts.get(1));
        assertEquals(Money.ofPaise(33), parts.get(2));

        // Sum must be exact
        long sum = parts.stream().mapToLong(Money::paise).sum();
        assertEquals(100L, sum);

        // Split with weights
        Money total = Money.ofPaise(1000);
        List<Money> weighted = total.allocate(2, 3, 5);
        assertEquals(Money.ofPaise(200), weighted.get(0));
        assertEquals(Money.ofPaise(300), weighted.get(1));
        assertEquals(Money.ofPaise(500), weighted.get(2));
    }
}
