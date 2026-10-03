package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.recovery.Rebuildable;
import com.bookmycourt.common.time.ClubTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Rebuilds the in-memory grid from the occupancy table. The DB is the source of
 * truth.
 */
@Component
public class CalendarRebuilder implements Rebuildable {

    private static final Logger log = LoggerFactory.getLogger(CalendarRebuilder.class);

    private final OccupancyService occupancyService;
    private final BookingRepository bookingRepository;
    private final CalendarRegistry registry;
    private final Clock clock;

    public CalendarRebuilder(
            OccupancyService occupancyService,
            BookingRepository bookingRepository,
            CalendarRegistry registry,
            Clock clock
    ) {
        this.occupancyService = occupancyService;
        this.bookingRepository = bookingRepository;
        this.registry = registry;
        this.clock = clock;
    }

    @Override
    public String name() {
        return "CalendarRebuilder";
    }

    @Override
    public void rebuild() {
        log.info("Rebuilding CourtDayCalendars from active occupancy records...");
        registry.clear();

        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        OffsetDateTime from = today.minusDays(1).atStartOfDay(ClubTime.IST).toOffsetDateTime();
        OffsetDateTime to = today.plusDays(61).atStartOfDay(ClubTime.IST).toOffsetDateTime();

        List<OccupancyService.OccupancyItem> items = occupancyService.findActiveBetween(from, to);

        for (OccupancyService.OccupancyItem item : items) {
            LocalDate first = item.startTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
            LocalDate last = DayMasks.lastDay(item.startTime(), item.endTime());

            boolean pending = false;
            if ("BOOKING".equals(item.occupancyType()) && item.bookingId() != null) {
                pending = bookingRepository.findById(item.bookingId())
                        .map(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                        .orElse(false);
            }

            // Each day gets only its own clipped part of the range (multi-day blocks, overnight blocks).
            for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1)) {
                long mask = DayMasks.mask(item.startTime(), item.endTime(), day);
                if (mask == 0) {
                    continue;
                }
                CourtDayCalendar cal = registry.get(new Keys.CourtDay(item.courtId(), day));
                switch (item.occupancyType()) {
                    case "BOOKING" -> {
                        if (pending) {
                            cal.occupyHeld(mask); 
                        }else {
                            cal.occupyBooked(mask);
                        }
                    }
                    case "SOCIAL_SESSION" ->
                        cal.occupySocial(mask);
                    case "MAINTENANCE" ->
                        cal.occupyBlocked(mask);
                    default ->
                        cal.occupyBooked(mask);
                }
            }
        }
        log.info("CalendarRebuilder completed. Loaded {} occupancy records.", items.size());
    }

    @Override
    public List<String> verify() {
        List<String> discrepancies = new ArrayList<>();
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        OffsetDateTime from = today.atStartOfDay(ClubTime.IST).toOffsetDateTime();
        OffsetDateTime to = today.plusDays(8).atStartOfDay(ClubTime.IST).toOffsetDateTime();

        for (OccupancyService.OccupancyItem item : occupancyService.findActiveBetween(from, to)) {
            LocalDate first = item.startTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
            LocalDate last = DayMasks.lastDay(item.startTime(), item.endTime());
            for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1)) {
                long mask = DayMasks.mask(item.startTime(), item.endTime(), day);
                CourtDayCalendar cal = registry.get(new Keys.CourtDay(item.courtId(), day));
                if (mask != 0 && (cal.occupied() & mask) != mask) {
                    discrepancies.add("Missing mask for court " + item.courtId() + " on " + day);
                }
            }
        }
        return discrepancies;
    }
}
