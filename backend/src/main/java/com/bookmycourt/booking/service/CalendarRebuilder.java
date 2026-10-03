package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.recovery.Rebuildable;
import com.bookmycourt.common.time.ClubTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        OffsetDateTime to = today.plusDays(60).atTime(23, 59, 59).atZone(ClubTime.IST).toOffsetDateTime();

        List<OccupancyService.OccupancyItem> items = occupancyService.findActiveBetween(from, to);

        for (OccupancyService.OccupancyItem item : items) {
            ZonedDateTime localStart = item.startTime().atZoneSameInstant(ClubTime.IST);
            ZonedDateTime localEnd = item.endTime().atZoneSameInstant(ClubTime.IST);
            LocalDate day = localStart.toLocalDate();

            int startSlot = localStart.getHour() * 2 + localStart.getMinute() / 30;
            int endSlot = localEnd.getHour() * 2 + localEnd.getMinute() / 30;
            if (endSlot <= startSlot) {
                endSlot = startSlot + 2; // Default 1 hour
            }
            long mask = SlotMask.range(startSlot, endSlot);

            CourtDayCalendar cal = registry.get(new Keys.CourtDay(item.courtId(), day));

            switch (item.occupancyType()) {
                case "BOOKING" -> {
                    boolean isPending = false;
                    if (item.bookingId() != null) {
                        isPending = bookingRepository.findById(item.bookingId())
                                .map(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                                .orElse(false);
                    }
                    if (isPending) {
                        cal.occupyHeld(mask);
                    } else {
                        cal.occupyBooked(mask);
                    }
                }
                case "SOCIAL_SESSION" -> cal.occupySocial(mask);
                case "MAINTENANCE" -> cal.occupyBlocked(mask);
                default -> cal.occupyBooked(mask);
            }
        }
        log.info("CalendarRebuilder completed. Loaded {} occupancy records.", items.size());
    }

    @Override
    public List<String> verify() {
        List<String> discrepancies = new ArrayList<>();
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        OffsetDateTime from = today.atStartOfDay(ClubTime.IST).toOffsetDateTime();
        OffsetDateTime to = today.plusDays(7).atTime(23, 59, 59).atZone(ClubTime.IST).toOffsetDateTime();

        List<OccupancyService.OccupancyItem> items = occupancyService.findActiveBetween(from, to);
        for (OccupancyService.OccupancyItem item : items) {
            ZonedDateTime localStart = item.startTime().atZoneSameInstant(ClubTime.IST);
            LocalDate day = localStart.toLocalDate();
            int startSlot = localStart.getHour() * 2 + localStart.getMinute() / 30;
            long mask = SlotMask.session(startSlot);

            CourtDayCalendar cal = registry.get(new Keys.CourtDay(item.courtId(), day));
            if ((cal.occupied() & mask) == 0) {
                discrepancies.add("Missing mask for court " + item.courtId() + " on " + day + " slot " + startSlot);
            }
        }
        return discrepancies;
    }
}
