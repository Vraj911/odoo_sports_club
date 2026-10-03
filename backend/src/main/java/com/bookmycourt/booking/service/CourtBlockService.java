package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.events.BookingEvents;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.payment.entity.PaymentDue;
import com.bookmycourt.payment.repository.PaymentDueRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CourtBlockService {

    private final Guard guard;
    private final CalendarRegistry calendarRegistry;
    private final OccupancyService occupancyService;
    private final BookingRepository bookingRepository;
    private final PaymentDueRepository paymentDueRepository;
    private final AuditService auditService;
    private final DomainEventPublisher publisher;
    private final Clock clock;

    public CourtBlockService(
            Guard guard,
            CalendarRegistry calendarRegistry,
            OccupancyService occupancyService,
            BookingRepository bookingRepository,
            PaymentDueRepository paymentDueRepository,
            AuditService auditService,
            DomainEventPublisher publisher,
            Clock clock
    ) {
        this.guard = guard;
        this.calendarRegistry = calendarRegistry;
        this.occupancyService = occupancyService;
        this.bookingRepository = bookingRepository;
        this.paymentDueRepository = paymentDueRepository;
        this.auditService = auditService;
        this.publisher = publisher;
        this.clock = clock;
    }

    public record BlockResult(boolean blocked, UUID occupancyId, List<UUID> conflictingBookings, String message) {

    }

    private record Freed(LocalDate day, long mask) {

    }

    private static List<Object> keysFor(UUID courtId, OffsetDateTime start, OffsetDateTime end) {
        List<Object> keys = new ArrayList<>();
        LocalDate d = start.atZoneSameInstant(ClubTime.IST).toLocalDate();
        LocalDate last = DayMasks.lastDay(start, end);
        while (!d.isAfter(last)) {
            keys.add(new Keys.CourtDay(courtId, d));
            d = d.plusDays(1);
        }
        keys.sort(Comparator.comparing(Object::toString));
        return keys;
    }

    public BlockResult block(UUID courtId, OffsetDateTime start, OffsetDateTime end, String reason, boolean forceCancel) {
        if (start == null || end == null || !start.isBefore(end)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "start must be before end");
        }
        if (!end.isAfter(OffsetDateTime.now(clock))) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Block must end in the future");
        }
        final String why = (reason == null || reason.isBlank()) ? "Maintenance" : reason;
        final LocalDate firstDay = start.atZoneSameInstant(ClubTime.IST).toLocalDate();
        final LocalDate lastDay = DayMasks.lastDay(start, end);

        return guard.run(keysFor(courtId, start, end), () -> {
            if (occupancyService.countActiveNonBookingOverlapping(courtId, start, end) > 0) {
                return Guard.Decision.noop(new BlockResult(false, null, List.of(),
                        "Overlaps a social session or an existing block"));
            }

            List<UUID> conflicts = occupancyService.findActiveBookingIdsOverlapping(courtId, start, end);
            if (!conflicts.isEmpty() && !forceCancel) {
                return Guard.Decision.noop(new BlockResult(false, null, conflicts,
                        "Court has " + conflicts.size() + " conflicting bookings. Set forceCancel=true to override."));
            }
            for (UUID id : conflicts) {
                String s = bookingRepository.findById(id).map(Booking::getStatus).orElse("");
                if (!"PENDING".equals(s) && !"CONFIRMED".equals(s)) {
                    return Guard.Decision.noop(new BlockResult(false, null, conflicts,
                            "Overlaps sessions already checked-in or completed; they cannot be cancelled"));
                }
            }

            Instant now = clock.instant();
            UUID actorId = ActorHolder.current().userId();
            List<Freed> freed = new ArrayList<>();
            List<Object[]> cancelledEvents = new ArrayList<>(); // {bookingId, refund}

            return new Guard.Decision<>(
                    () -> {
                        for (Object k : keysFor(courtId, start, end)) {
                            occupancyService.lockKey("court:" + ((Keys.CourtDay) k).courtId() + ":" + ((Keys.CourtDay) k).day());
                        }

                        for (UUID bookingId : conflicts) {
                            Booking b = bookingRepository.findById(bookingId).orElse(null);
                            if (b == null) {
                                continue;
                            }
                            boolean paid = "PAID".equals(b.getPaymentStatus());
                            b.setStatus("CANCELLED");
                            b.setCancelReason("Court block: " + why);
                            b.setCancelledAt(OffsetDateTime.now(clock));
                            bookingRepository.save(b);
                            occupancyService.releaseBooking(bookingId);

                            for (PaymentDue due : paymentDueRepository.findByRefTypeAndRefId("BOOKING", bookingId)) {
                                if ("OPEN".equals(due.getStatus())) {
                                    due.setStatus("VOID");
                                    paymentDueRepository.save(due);
                                }
                            }

                            LocalDate bDay = b.getStartTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
                            freed.add(new Freed(bDay, SlotMask.session(
                                    b.getStartTime().atZoneSameInstant(ClubTime.IST).getHour() * 2
                                    + b.getStartTime().atZoneSameInstant(ClubTime.IST).getMinute() / 30)));

                            // Club-initiated cancellation: full refund of anything paid.
                            Money refund = (paid && b.getPriceCharged() != null && b.getPriceCharged().signum() > 0)
                            ? Money.ofRupees(b.getPriceCharged()) : Money.ZERO;
                            cancelledEvents.add(new Object[]{bookingId, refund});

                            auditService.record("FORCE_CANCEL_FOR_BLOCK", "BOOKING", bookingId,
                                    Map.of("courtId", String.valueOf(courtId), "reason", why, "cancelledBy", String.valueOf(actorId)));
                        }

                        UUID occId = occupancyService.recordMaintenance(courtId, start, end, why, actorId);
                        return new BlockResult(true, occId, conflicts, "Court successfully blocked for maintenance");
                    },
                    () -> {
                        // Memory: first free what the cancelled bookings held, then mark the block.
                        for (Freed f : freed) {
                            CourtDayCalendar cal = calendarRegistry.get(courtId, f.day());
                            cal.releaseBooked(f.mask());
                            cal.releaseHeld(f.mask());
                        }
                        for (LocalDate d = firstDay; !d.isAfter(lastDay); d = d.plusDays(1)) {
                            long m = DayMasks.mask(start, end, d);
                            if (m != 0) {
                                calendarRegistry.get(courtId, d).occupyBlocked(m);
                            }
                            publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, courtId, d));
                        }
                        for (Object[] ev : cancelledEvents) {
                            publisher.publish(new BookingEvents.BookingCancelled(
                                    UUID.randomUUID(), now, (UUID) ev[0], ((Money) ev[1]).toRupees()));
                        }
                        publisher.publish(new BookingEvents.CourtBlocked(UUID.randomUUID(), now, courtId));
                    }
            );
        });
    }

    /**
     * Range is read from the stored block, never trusted from the client.
     */
    public void unblock(UUID occupancyId, UUID courtId) {
        OccupancyService.OccupancyItem item = occupancyService.findMaintenance(occupancyId)
                .filter(i -> i.courtId().equals(courtId))
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Active block not found for this court"));

        final LocalDate firstDay = item.startTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
        final LocalDate lastDay = DayMasks.lastDay(item.startTime(), item.endTime());

        guard.run(keysFor(courtId, item.startTime(), item.endTime()), () -> {
            Instant now = clock.instant();
            return new Guard.Decision<>(
                    () -> {
                        occupancyService.releaseMaintenance(occupancyId);
                        return true;
                    },
                    () -> {
                        for (LocalDate d = firstDay; !d.isAfter(lastDay); d = d.plusDays(1)) {
                            long m = DayMasks.mask(item.startTime(), item.endTime(), d);
                            calendarRegistry.get(courtId, d).releaseBlocked(m);
                            publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, courtId, d));
                        }
                        publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), now, courtId, firstDay,
                                item.startTime().atZoneSameInstant(ClubTime.IST).getHour() * 2));
                    }
            );
        });
    }
}
