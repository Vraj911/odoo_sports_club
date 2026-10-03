package com.bookmycourt.booking.engine;

/**
 * Occupancy of ONE court on ONE day as a 48-bit mask.
 *
 * Threading contract:
 *  - WRITES (occupy / release) are only ever done while holding that court-day's lock (see LockTable).
 *  - READS may happen without the lock. The field is volatile so readers see the latest value.
 *  - occupy/release are idempotent bit operations, so reloading from the database is safe.
 */
final class CourtDayCalendar {

    private volatile long occupied;

    CourtDayCalendar(long initialMask) {
        this.occupied = initialMask;
    }

    boolean isFree(long mask) { return (occupied & mask) == 0; }

    void occupy(long mask) { occupied |= mask; }

    void release(long mask) { occupied &= ~mask; }

    long occupiedMask() { return occupied; }

    /**
     * Bit i is set iff a 60-minute session can start at slot i, i.e. slots i AND i+1 are both free.
     */
    long startable(long openStarts) {
        long free = ~occupied;
        return free & (free >>> 1) & openStarts;
    }
}
