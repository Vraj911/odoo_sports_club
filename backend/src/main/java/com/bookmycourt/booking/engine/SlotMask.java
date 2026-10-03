package com.bookmycourt.booking.engine;

/**
 * A court-day is 48 half-hour slots, so it fits in ONE long: bit i = slot i is occupied.
 *
 *   a 60-minute session starting at slot s covers slots s and s+1  ->  mask = 0b11 << s
 *   two sessions overlap  <=>  (maskA & maskB) != 0
 */
public final class SlotMask {
    private SlotMask() {}

    static final int SLOTS_PER_DAY = 48;

    /** Mask of a 60-minute session starting at {@code startSlot} (0..46). */
    public static long session(int startSlot) {
        return 0b11L << startSlot;
    }

    public static long range(int from, int toExclusive) {
        return ((1L << (toExclusive - from)) - 1) << from;
    }

    public static long openStarts(int openSlot, int closeSlot) {
        return range(openSlot, closeSlot - 1);
    }
}
