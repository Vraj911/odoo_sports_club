package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.facility.entity.Court;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class AlternativeSlots {

    private AlternativeSlots() {}

    public record CandidateSlot(UUID courtId, String courtName, int startSlot, String startTime) {}

    public static List<CandidateSlot> suggest(
            List<Court> courtsOfSport,
            Map<UUID, CourtDayCalendar> calendars,
            long openStarts,
            LocalDate day,
            LocalDate today,
            int nowSlot,
            int requestedSlot
    ) {
        boolean isToday = day.equals(today);
        List<CandidateSlot> candidates = new ArrayList<>();

        for (Court court : courtsOfSport) {
            CourtDayCalendar cal = calendars.get(court.getId());
            long bits = (cal != null) ? cal.startable(openStarts) : openStarts;

            while (bits != 0) {
                int slot = Long.numberOfTrailingZeros(bits);
                bits &= bits - 1;

                if (isToday && slot <= nowSlot) {
                    continue;
                }

                int hour = slot / 2;
                int min = (slot % 2) * 30;
                String timeStr = String.format("%02d:%02d", hour, min);
                candidates.add(new CandidateSlot(court.getId(), court.getName(), slot, timeStr));
            }
        }

        candidates.sort(Comparator
                .comparingInt((CandidateSlot s) -> Math.abs(s.startSlot() - requestedSlot))
                .thenComparing(CandidateSlot::courtName));

        return candidates.subList(0, Math.min(5, candidates.size()));
    }
}
