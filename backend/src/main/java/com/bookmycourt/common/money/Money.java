package com.bookmycourt.common.money;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public record Money(long paise) implements Comparable<Money> {

    public static final Money ZERO = new Money(0L);

    public static Money ofPaise(long paise) {
        return new Money(paise);
    }

    public static Money ofRupees(BigDecimal rupees) {
        if (rupees == null) {
            return ZERO;
        }
        BigDecimal scaled = rupees.setScale(2, RoundingMode.HALF_UP);
        return new Money(scaled.movePointRight(2).longValueExact());
    }

    public static Money ofRupees(long rupees) {
        return new Money(Math.multiplyExact(rupees, 100L));
    }

    public BigDecimal toRupees() {
        return BigDecimal.valueOf(paise, 2);
    }

    public Money plus(Money other) {
        return new Money(Math.addExact(this.paise, other.paise));
    }

    public Money minus(Money other) {
        return new Money(Math.subtractExact(this.paise, other.paise));
    }

    public Money times(int factor) {
        return new Money(Math.multiplyExact(this.paise, (long) factor));
    }

    public Money negate() {
        return new Money(Math.negateExact(this.paise));
    }

    public boolean isZero() {
        return this.paise == 0L;
    }

    public boolean isNegative() {
        return this.paise < 0L;
    }

    public boolean isPositive() {
        return this.paise > 0L;
    }

    public Money percent(BigDecimal ratePercent) {
        if (ratePercent == null || ratePercent.signum() == 0 || this.paise == 0L) {
            return ZERO;
        }
        BigDecimal calculated = BigDecimal.valueOf(this.paise)
                .multiply(ratePercent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        return new Money(calculated.longValueExact());
    }

    /**
     * Largest remainder method (Hare-Niemeyer method) for allocating money across integer weights.
     * Guarantees the allocated parts sum exactly to this Money instance.
     */
    public List<Money> allocate(int... weights) {
        if (weights == null || weights.length == 0) {
            throw new IllegalArgumentException("Weights cannot be empty");
        }
        long sumWeights = 0L;
        for (int w : weights) {
            if (w < 0) {
                throw new IllegalArgumentException("Weights must be non-negative");
            }
            sumWeights += w;
        }
        if (sumWeights == 0L) {
            throw new IllegalArgumentException("Sum of weights must be positive");
        }

        long sign = Long.signum(this.paise);
        long absTotal = Math.abs(this.paise);

        long[] base = new long[weights.length];
        long[] frac = new long[weights.length];
        long allocatedSum = 0L;

        for (int i = 0; i < weights.length; i++) {
            long numerator = Math.multiplyExact(absTotal, (long) weights[i]);
            base[i] = numerator / sumWeights;
            frac[i] = numerator % sumWeights;
            allocatedSum += base[i];
        }

        long remainder = absTotal - allocatedSum;

        Integer[] order = new Integer[weights.length];
        for (int i = 0; i < weights.length; i++) {
            order[i] = i;
        }

        // Sort indices by largest remainder first, breaking ties by lowest index
        Arrays.sort(order, Comparator.<Integer>comparingLong(idx -> frac[idx])
                .reversed()
                .thenComparingInt(idx -> idx));

        for (int i = 0; i < remainder; i++) {
            base[order[i]]++;
        }

        List<Money> result = new ArrayList<>(weights.length);
        for (long b : base) {
            result.add(new Money(sign * b));
        }
        return List.copyOf(result);
    }

    @Override
    public int compareTo(Money o) {
        return Long.compare(this.paise, o.paise);
    }

    @Override
    public String toString() {
        return "Rs " + toRupees().toPlainString();
    }
}
