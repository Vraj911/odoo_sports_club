package com.bookmycourt.booking.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;

import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.common.time.ClubTime;

/**
 * Slot mask of [start, end) clipped to one club-local day (Asia/Kolkata).
 */
public final class DayMasks {

    private DayMasks() {
    }

    public static long mask(OffsetDateTime start, OffsetDateTime end, LocalDate day) {
        ZonedDateTime dayStart = day.atStartOfDay(ClubTime.IST);
        ZonedDateTime dayEnd = day.plusDays(1).atStartOfDay(ClubTime.IST);

        ZonedDateTime s = start.atZoneSameInstant(ClubTime.IST);
        ZonedDateTime e = end.atZoneSameInstant(ClubTime.IST);
        if (s.isBefore(dayStart)) {
            s = dayStart;
        }
        if (e.isAfter(dayEnd)) {
            e = dayEnd;
        }
        if (!s.isBefore(e)) {
            return 0L;
        }

        int from = (int) (Duration.between(dayStart, s).toMinutes() / 30);
        int to = (int) Math.ceil(Duration.between(dayStart, e).toMinutes() / 30.0);
        return SlotMask.range(from, Math.min(48, to));
    }

    /**
     * Last club-local day touched by [start, end).
     */
    public static LocalDate lastDay(OffsetDateTime start, OffsetDateTime end) {
        LocalDate d = end.atZoneSameInstant(ClubTime.IST).toLocalDate();
        boolean endsAtMidnight = end.atZoneSameInstant(ClubTime.IST).toLocalTime().equals(java.time.LocalTime.MIDNIGHT);
        return endsAtMidnight && end.isAfter(start) ? d.minusDays(1) : d;
    }
}
