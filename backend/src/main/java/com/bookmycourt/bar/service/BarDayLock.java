package com.bookmycourt.bar.service;

import com.bookmycourt.bar.repository.BarDayCloseRepository;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** BR-14 / NFR-13: "day" is always computed in Asia/Kolkata; a closed bar day cannot be edited. */
@Component
public class BarDayLock {

    public static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final BarDayCloseRepository closes;
    private final Clock clock;

    public BarDayLock(BarDayCloseRepository closes, Clock clock) {
        this.closes = closes;
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(IST));
    }

    public LocalDate dayOf(Instant instant) {
        return instant == null ? today() : instant.atZone(IST).toLocalDate();
    }

    public boolean isClosed(LocalDate date) {
        return closes.findByBusinessDate(date).map(c -> "CLOSED".equals(c.getStatus())).orElse(false);
    }

    public void assertOpen(LocalDate date) {
        if (isClosed(date)) {
            throw BarErrors.conflict("Bar day " + date + " is closed. A manager must reopen it before changes can be made.");
        }
    }

    public void assertOpenToday() {
        assertOpen(today());
    }
}
