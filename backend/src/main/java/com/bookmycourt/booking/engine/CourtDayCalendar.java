package com.bookmycourt.booking.engine;

public final class CourtDayCalendar {
    private volatile long booked;
    private volatile long held;
    private volatile long social;
    private volatile long blocked;

    public CourtDayCalendar() {
        this(0L, 0L, 0L, 0L);
    }

    public CourtDayCalendar(long initialMask) {
        this(initialMask, 0L, 0L, 0L);
    }

    public CourtDayCalendar(long booked, long held, long social, long blocked) {
        this.booked = booked;
        this.held = held;
        this.social = social;
        this.blocked = blocked;
    }

    public long occupied() {
        return booked | held | social | blocked;
    }

    public boolean isFree(long mask) {
        return (occupied() & mask) == 0;
    }

    public void occupy(long mask) {
        occupyBooked(mask);
    }

    public void occupyBooked(long mask) {
        booked |= mask;
        held &= ~mask;
    }

    public void occupyHeld(long mask) {
        held |= mask;
    }

    public void occupySocial(long mask) {
        social |= mask;
    }

    public void occupyBlocked(long mask) {
        blocked |= mask;
    }

    public void releaseBooked(long mask) {
        booked &= ~mask;
    }

    public void releaseHeld(long mask) {
        held &= ~mask;
    }

    public void releaseSocial(long mask) {
        social &= ~mask;
    }

    public void releaseBlocked(long mask) {
        blocked &= ~mask;
    }

    public void release(long mask) {
        booked &= ~mask;
        held &= ~mask;
        social &= ~mask;
        blocked &= ~mask;
    }

    public long bookedMask() {
        return booked;
    }

    public long heldMask() {
        return held;
    }

    public long socialMask() {
        return social;
    }

    public long blockedMask() {
        return blocked;
    }

    public long occupiedMask() {
        return occupied();
    }

    public long startable(long openStarts) {
        long free = ~occupied();
        return free & (free >>> 1) & openStarts;
    }
}
