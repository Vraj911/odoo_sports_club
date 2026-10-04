package com.bookmycourt.shop.service;

import java.util.List;
import java.util.Set;

/** Appendix A shop-order state machine + vocabulary. */
public final class ShopStatus {

    private ShopStatus() {
    }

    public static final String PLACED = "PLACED";
    public static final String PAID = "PAID";
    public static final String PACKED = "PACKED";
    public static final String READY_FOR_PICKUP = "READY_FOR_PICKUP";
    public static final String OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";
    public static final String COLLECTED = "COLLECTED";
    public static final String DELIVERED = "DELIVERED";
    public static final String RETURNED = "RETURNED";
    public static final String CANCELLED = "CANCELLED";
    public static final String FAILED = "FAILED";   // legacy value, treated as released

    public static final String PICKUP = "PICKUP";
    public static final String DELIVERY = "DELIVERY";

    public static final String CHANNEL_COUNTER = "COUNTER";
    public static final String CHANNEL_ONLINE = "ONLINE";

    /** Statuses that only staff may set through PATCH /orders/{id}/status. PAID/CANCELLED/RETURNED have own paths. */
    public static final Set<String> STAFF_SETTABLE = Set.of(PACKED, READY_FOR_PICKUP, OUT_FOR_DELIVERY, COLLECTED, DELIVERED);

    /** Orders still holding a stock reservation. */
    public static final List<String> HOLDS_RESERVATION = List.of(PLACED, PAID, PACKED, READY_FOR_PICKUP, OUT_FOR_DELIVERY);

    /** Orders that count as a completed sale for reports. */
    public static final List<String> SOLD = List.of(PAID, PACKED, READY_FOR_PICKUP, OUT_FOR_DELIVERY, COLLECTED, DELIVERED, RETURNED);

    // movement types
    public static final String RECEIPT = "RECEIPT";
    public static final String SALE = "SALE";
    public static final String RETURN = "RETURN";
    public static final String ADJUSTMENT_IN = "ADJUSTMENT_IN";
    public static final String ADJUSTMENT_OUT = "ADJUSTMENT_OUT";
    public static final String DAMAGE = "DAMAGE";
    public static final String RESERVE = "RESERVE";
    public static final String RELEASE = "RELEASE";

    /** Types a person may record manually through POST /inventory/movement. */
    public static final Set<String> MANUAL_MOVEMENTS = Set.of(RECEIPT, ADJUSTMENT_IN, ADJUSTMENT_OUT, DAMAGE);
    public static final Set<String> REASON_REQUIRED = Set.of(ADJUSTMENT_IN, ADJUSTMENT_OUT, DAMAGE);

    public static boolean canMove(String from, String to, String fulfillment) {
        if (from == null) return false;
        boolean pickup = !DELIVERY.equalsIgnoreCase(fulfillment);
        return switch (from) {
            case PAID -> PACKED.equals(to);
            case PACKED -> pickup ? READY_FOR_PICKUP.equals(to) : OUT_FOR_DELIVERY.equals(to);
            case READY_FOR_PICKUP -> COLLECTED.equals(to);
            case OUT_FOR_DELIVERY -> DELIVERED.equals(to);
            default -> false;
        };
    }
}
