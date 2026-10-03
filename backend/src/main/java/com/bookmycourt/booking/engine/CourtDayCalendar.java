package com.bookmycourt.booking.engine;
final class CourtDayCalendar {
    private volatile long occupied;
    CourtDayCalendar(long initialMask) {
        this.occupied = initialMask;
    }
    boolean isFree(long mask) { return (occupied & mask) == 0; }
    void occupy(long mask) { occupied |= mask; }
    void release(long mask) { occupied &= ~mask; }
    long occupiedMask() { return occupied; }
    long startable(long openStarts) {
        long free = ~occupied;
        return free & (free >>> 1) & openStarts;
    }
}
