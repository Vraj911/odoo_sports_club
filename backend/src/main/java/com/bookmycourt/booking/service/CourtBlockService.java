package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.events.BookingEvents;
import com.bookmycourt.common.time.ClubTime;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CourtBlockService {

    private final Guard guard;
    private final CalendarRegistry calendarRegistry;
    private final OccupancyService occupancyService;
    private final BookingRepository bookingRepository;
    private final AuditService auditService;
    private final DomainEventPublisher publisher;
    private final Clock clock;

    public CourtBlockService(
            Guard guard,
            CalendarRegistry calendarRegistry,
            OccupancyService occupancyService,
            BookingRepository bookingRepository,
            AuditService auditService,
            DomainEventPublisher publisher,
            Clock clock
    ) {
        this.guard = guard;
        this.calendarRegistry = calendarRegistry;
        this.occupancyService = occupancyService;
        this.bookingRepository = bookingRepository;
        this.auditService = auditService;
        this.publisher = publisher;
        this.clock = clock;
    }

    public record BlockResult(boolean blocked, UUID occupancyId, List<UUID> conflictingBookings, String message) {}

    public BlockResult block(UUID courtId, OffsetDateTime start, OffsetDateTime end, String reason, boolean forceCancel) {
        LocalDate startDate = start.atZoneSameInstant(ClubTime.IST).toLocalDate();
        LocalDate endDate = end.atZoneSameInstant(ClubTime.IST).toLocalDate();

        List<Object> keys = new ArrayList<>();
        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            keys.add(new Keys.CourtDay(courtId, curr));
            curr = curr.plusDays(1);
        }

        return guard.run(keys, () -> {
            List<UUID> conflicts = occupancyService.findActiveBookingIdsOverlapping(courtId, start, end);
            if (!conflicts.isEmpty() && !forceCancel) {
                return Guard.Decision.noop(new BlockResult(
                        false, null, conflicts, "Court has " + conflicts.size() + " conflicting bookings. Set forceCancel=true to override."
                ));
            }

            Instant now = clock.instant();
            UUID actorId = ActorHolder.current().userId();

            return new Guard.Decision<>(
                    () -> {
                        // 1. Force cancel conflicting bookings if requested
                        if (forceCancel && !conflicts.isEmpty()) {
                            for (UUID bookingId : conflicts) {
                                bookingRepository.findById(bookingId).ifPresent(b -> {
                                    b.setStatus("CANCELLED");
                                    b.setCancelReason("Court maintenance block: " + reason);
                                    b.setCancelledAt(OffsetDateTime.now(clock));
                                    bookingRepository.save(b);
                                    occupancyService.releaseBooking(bookingId);
                                    auditService.record("FORCE_CANCEL_FOR_BLOCK", "BOOKING", bookingId,
                                            Map.of("courtId", courtId, "reason", reason, "cancelledBy", actorId));
                                });
                            }
                        }

                        // 2. Insert occupancy for maintenance
                        UUID occId = occupancyService.recordMaintenance(courtId, start, end, reason, actorId);
                        return new BlockResult(true, occId, conflicts, "Court successfully blocked for maintenance");
                    },
                    () -> {
                        // 3. Update memory masks
                        LocalDate d = startDate;
                        while (!d.isAfter(endDate)) {
                            CourtDayCalendar cal = calendarRegistry.get(courtId, d);
                            ZonedDateTime dayStart = d.atStartOfDay(ClubTime.IST);
                            ZonedDateTime dayEnd = d.plusDays(1).atStartOfDay(ClubTime.IST);

                            ZonedDateTime blockStart = start.atZoneSameInstant(ClubTime.IST);
                            ZonedDateTime blockEnd = end.atZoneSameInstant(ClubTime.IST);

                            ZonedDateTime effectiveStart = blockStart.isBefore(dayStart) ? dayStart : blockStart;
                            ZonedDateTime effectiveEnd = blockEnd.isAfter(dayEnd) ? dayEnd : blockEnd;

                            if (effectiveStart.isBefore(effectiveEnd)) {
                                int sSlot = effectiveStart.getHour() * 2 + effectiveStart.getMinute() / 30;
                                int eSlot = effectiveEnd.getHour() * 2 + effectiveEnd.getMinute() / 30;
                                if (eSlot <= sSlot && !effectiveEnd.isBefore(dayEnd)) {
                                    eSlot = 48;
                                }
                                long mask = SlotMask.range(sSlot, Math.min(48, Math.max(sSlot + 1, eSlot)));
                                cal.occupyBlocked(mask);
                            }
                            publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, courtId, d));
                            d = d.plusDays(1);
                        }
                        publisher.publish(new BookingEvents.CourtBlocked(UUID.randomUUID(), now, courtId));
                    }
            );
        });
    }

    public void unblock(UUID occupancyId, UUID courtId, LocalDate day, int startSlot, int endSlot) {
        Keys.CourtDay key = new Keys.CourtDay(courtId, day);
        guard.run(List.of(key), () -> {
            Instant now = clock.instant();
            return new Guard.Decision<>(
                    () -> {
                        occupancyService.releaseMaintenance(occupancyId);
                        return true;
                    },
                    () -> {
                        CourtDayCalendar cal = calendarRegistry.get(courtId, day);
                        long mask = SlotMask.range(startSlot, endSlot);
                        cal.releaseBlocked(mask);
                        publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), now, courtId, day, startSlot));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, courtId, day));
                    }
            );
        });
    }
}
