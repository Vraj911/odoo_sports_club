package com.bookmycourt.bar.service;

import java.util.List;
import java.util.Set;

/** One place for every status string used by the bar module (Appendix A state machines). */
public final class BarStatus {

    private BarStatus() {
    }

    // order
    public static final String OPEN = "OPEN";
    public static final String SENT = "SENT";
    public static final String PARTIALLY_PAID = "PARTIALLY_PAID";
    public static final String PAID = "PAID";
    public static final String ON_ACCOUNT = "ON_ACCOUNT";
    public static final String VOID = "VOID";
    public static final String CANCELLED = "CANCELLED";
    /** Orders that can still be edited / paid. */
    public static final List<String> ACTIVE = List.of(OPEN, SENT, PARTIALLY_PAID);

    // table (BAR-02)
    public static final String FREE = "FREE";
    public static final String OCCUPIED = "OCCUPIED";
    public static final String BILL_REQUESTED = "BILL_REQUESTED";
    public static final String RESERVED = "RESERVED";
    public static final Set<String> TABLE_STATUSES = Set.of(FREE, OCCUPIED, BILL_REQUESTED, RESERVED);

    // kitchen line (BAR-04)
    public static final String NEW = "NEW";
    public static final String PREPARING = "PREPARING";
    public static final String READY = "READY";
    public static final String SERVED = "SERVED";
    public static final String LINE_VOID = "VOID";
    public static final List<String> LINE_FLOW = List.of(NEW, PREPARING, READY, SERVED);

    // stations
    public static final String KITCHEN = "KITCHEN";
    public static final String BAR = "BAR";

    // tab
    public static final String TAB_OPEN = "OPEN";
    public static final String TAB_SETTLED = "SETTLED";
    public static final String TAB_MOVED = "MOVED_TO_ACCOUNT";

    // payment
    public static final Set<String> METHODS = Set.of("CASH", "CARD", "UPI");
}
