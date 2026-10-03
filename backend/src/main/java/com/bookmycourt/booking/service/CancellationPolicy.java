package com.bookmycourt.booking.service;

import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.common.money.Money;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

public final class CancellationPolicy {

    private CancellationPolicy() {}

    /**
     * Pure refund calculation:
     * Staff cancel -> 100% refund
     * Free window (>= cancelFreeHours before start) -> 100% refund
     * Late cancel -> lateCancelRefundPercent % of price charged
     */
    public static Money refundFor(
            Booking booking,
            Instant now,
            boolean isStaffCancel,
            int cancelFreeHours,
            BigDecimal lateCancelRefundPercent
    ) {
        if (booking.getPriceCharged() == null || booking.getPriceCharged().signum() <= 0) {
            return Money.ZERO;
        }

        Money paid = Money.ofRupees(booking.getPriceCharged());
        if (isStaffCancel) {
            return paid;
        }

        Instant start = booking.getStartTime().toInstant();
        Duration hoursBefore = Duration.between(now, start);

        if (hoursBefore.toMinutes() >= cancelFreeHours * 60L) {
            return paid;
        }

        if (lateCancelRefundPercent == null || lateCancelRefundPercent.signum() <= 0) {
            return Money.ZERO;
        }

        return paid.percent(lateCancelRefundPercent);
    }
}
