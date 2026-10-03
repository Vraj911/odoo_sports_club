package com.bookmycourt.booking.service;

import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.common.money.Money;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class CancellationPolicyTest {

    @Test
    @DisplayName("Staff cancel always gives 100% refund regardless of time")
    void staffCancelRefunds100Percent() {
        Booking b = new Booking();
        b.setPriceCharged(new BigDecimal("500.00"));
        b.setStartTime(OffsetDateTime.of(2026, 10, 4, 10, 0, 0, 0, ZoneOffset.UTC));

        // 10 minutes before start
        Instant now = b.getStartTime().minusMinutes(10).toInstant();
        Money refund = CancellationPolicy.refundFor(b, now, true, 4, BigDecimal.ZERO);

        assertThat(refund.toRupees()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("Cancel more than cancelFreeHours before start gives 100% refund")
    void freeCancelWindowRefunds100Percent() {
        Booking b = new Booking();
        b.setPriceCharged(new BigDecimal("600.00"));
        b.setStartTime(OffsetDateTime.of(2026, 10, 4, 18, 0, 0, 0, ZoneOffset.UTC));

        // 5 hours before start
        Instant now = b.getStartTime().minusHours(5).toInstant();
        Money refund = CancellationPolicy.refundFor(b, now, false, 4, BigDecimal.ZERO);

        assertThat(refund.toRupees()).isEqualByComparingTo("600.00");
    }

    @Test
    @DisplayName("Late cancel applies lateCancelRefundPercent")
    void lateCancelAppliesPercentage() {
        Booking b = new Booking();
        b.setPriceCharged(new BigDecimal("1000.00"));
        b.setStartTime(OffsetDateTime.of(2026, 10, 4, 18, 0, 0, 0, ZoneOffset.UTC));

        // 2 hours before start (< 4 hours)
        Instant now = b.getStartTime().minusHours(2).toInstant();

        // 0% policy -> 0
        Money refundZero = CancellationPolicy.refundFor(b, now, false, 4, BigDecimal.ZERO);
        assertThat(refundZero.toRupees()).isEqualByComparingTo("0.00");

        // 50% policy -> 500
        Money refundHalf = CancellationPolicy.refundFor(b, now, false, 4, new BigDecimal("50.00"));
        assertThat(refundHalf.toRupees()).isEqualByComparingTo("500.00");
    }
}
