package com.bookmycourt.facility.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.time.ClubTime;

public final class SlotValidator {

    private SlotValidator() {
    }

    public static void validate(OffsetDateTime start,
            int advanceDays,
            ClubCalendarService calendar,
            Clock clock) {
        if (start == null) {
            throw new DomainException(ErrorCode.INVALID_SLOT, "Start time is required");
        }

        ZonedDateTime local = start.atZoneSameInstant(ClubTime.IST);
        if (local.getMinute() % 30 != 0 || local.getSecond() != 0 || local.getNano() != 0) {
            throw new DomainException(ErrorCode.INVALID_SLOT, "Bookings must start on a :00 or :30 boundary");
        }

        if (start.isBefore(OffsetDateTime.now(clock))) {
            throw new DomainException(ErrorCode.INVALID_SLOT, "Cannot book a slot in the past");
        }

        LocalDate day = local.toLocalDate();
        // "Today" must be the club's day (IST). On a UTC server LocalDate.now(clock) is wrong from 00:00 to 05:30 IST.
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));

        if (day.isAfter(today.plusDays(advanceDays))) {
            throw new DomainException(ErrorCode.TOO_FAR_AHEAD,
                    "Booking date " + day + " is beyond the allowed advance window of " + advanceDays + " days");
        }

        if (calendar.isClosed(day)) {
            throw new DomainException(ErrorCode.CLUB_CLOSED, "Club is closed on " + day);
        }

        int startSlot = local.getHour() * 2 + local.getMinute() / 30;
        int open = calendar.openSlot(day);
        int close = calendar.closeSlot(day);

        // A session is 60 minutes (2 slots), so the last valid start is close - 2.
        if (startSlot < open || startSlot > close - 2) {
            throw new DomainException(ErrorCode.OUTSIDE_HOURS,
                    "Requested time " + local.toLocalTime() + " is outside club hours ("
                    + slotTime(open) + " to " + slotTime(close) + "); last start is " + slotTime(close - 2));
        }
    }

    private static String slotTime(int slot) {
        return String.format("%02d:%02d", (slot / 2) % 24, (slot % 2) * 30);
    }
}
