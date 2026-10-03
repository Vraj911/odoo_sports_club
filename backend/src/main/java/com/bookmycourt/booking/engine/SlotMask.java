package com.bookmycourt.booking.engine;
public final class SlotMask {
    private SlotMask() {}
    static final int SLOTS_PER_DAY = 48;
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
