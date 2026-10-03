package com.bookmycourt.booking.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CourtAvailabilityResponse;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.Model.Channel;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.enums.BookingStatus;
import com.bookmycourt.pricing.service.PriceQuote;
import com.bookmycourt.booking.mapper.BookingMapper;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.events.BookingEvents;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.common.state.StateMachine;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.facility.service.SlotValidator;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.service.MembershipService;
import com.bookmycourt.payment.entity.PaymentDue;
import com.bookmycourt.payment.repository.PaymentDueRepository;
import com.bookmycourt.pricing.service.PricingEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookings;
    private final CourtRepository courts;
    private final MemberRepository members;
    private final BookingMapper mapper;
    private final PricingEngine pricingEngine;
    private final MembershipService membershipService;
    private final ClubCalendarService clubCalendarService;
    private final CalendarRegistry calendarRegistry;
    private final OccupancyService occupancyService;
    private final PaymentDueRepository paymentDueRepository;
    private final ClubSettingRepository clubSettingRepository;
    private final AuditService auditService;
    private final DomainEventPublisher publisher;
    private final Guard guard;
    private final Clock clock;

    private static final StateMachine<BookingStatus> STATE_MACHINE = StateMachine.of(BookingStatus.class)
            .allow(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.EXPIRED, BookingStatus.CANCELLED)
            .allow(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW)
            .allow(BookingStatus.CHECKED_IN, BookingStatus.COMPLETED, BookingStatus.CANCELLED)
            .build();

    public BookingService(
            BookingRepository bookings,
            CourtRepository courts,
            MemberRepository members,
            BookingMapper mapper,
            PricingEngine pricingEngine,
            MembershipService membershipService,
            ClubCalendarService clubCalendarService,
            CalendarRegistry calendarRegistry,
            OccupancyService occupancyService,
            PaymentDueRepository paymentDueRepository,
            ClubSettingRepository clubSettingRepository,
            AuditService auditService,
            DomainEventPublisher publisher,
            Guard guard,
            Clock clock
    ) {
        this.bookings = bookings;
        this.courts = courts;
        this.members = members;
        this.mapper = mapper;
        this.pricingEngine = pricingEngine;
        this.membershipService = membershipService;
        this.clubCalendarService = clubCalendarService;
        this.calendarRegistry = calendarRegistry;
        this.occupancyService = occupancyService;
        this.paymentDueRepository = paymentDueRepository;
        this.clubSettingRepository = clubSettingRepository;
        this.auditService = auditService;
        this.publisher = publisher;
        this.guard = guard;
        this.clock = clock;
    }

    public BookingResponse create(CreateBookingRequest request) {
        LocalTime startTime = LocalTime.parse(request.startTime());
        OffsetDateTime start = ZonedDateTime.of(request.date(), startTime, ClubTime.IST).toOffsetDateTime();
        OffsetDateTime end = start.plusMinutes(60);

        Court court = courts.findById(request.courtId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found"));

        if (!court.isActive()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Court is inactive");
        }

        if (request.memberId() == null && (request.guestName() == null || request.guestName().isBlank())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A member or guest name is required");
        }

        LocalDate day = request.date();
        int advanceDays = 7;
        Optional<Plan> activePlan = (request.memberId() != null)
                ? membershipService.activePlan(request.memberId(), day)
                : Optional.empty();
        if (activePlan.isPresent()) {
            advanceDays = activePlan.get().getAdvanceBookingDays();
        }

        // 1. Pre-lock checks
        String tier = (request.memberId() == null) ? "GUEST" : membershipService.tierAt(request.memberId(), start);
        SlotValidator.validate(start, advanceDays, clubCalendarService, clock);

        int startSlot = startTime.getHour() * 2 + startTime.getMinute() / 30;
        long mask = SlotMask.session(startSlot);

        PriceQuote quote = pricingEngine.quote(request.courtId(), tier, day, startTime);

        int defaultDailyCap = getIntSetting("booking.default_daily_cap", 2);
        int cap = defaultDailyCap;
        if (activePlan.isPresent() && activePlan.get().getMaxBookingsPerDay() > 0) {
            cap = activePlan.get().getMaxBookingsPerDay();
        }

        final int dailyCap = cap;
        Channel channel = parseChannel(request.channel());
        String paymentPolicy = request.paymentPolicy() != null ? request.paymentPolicy().toUpperCase(Locale.ROOT) : "PAY_NOW";

        // 2. Concurrency keys: MemberDay + CourtDay
        List<Object> keys = new ArrayList<>();
        if (request.memberId() != null) {
            keys.add(new Keys.MemberDay(request.memberId(), day));
        }
        keys.add(new Keys.CourtDay(request.courtId(), day));

        Actor currentActor = ActorHolder.current();

        Booking created = guard.run(keys, () -> {
            // Phase 1: DECIDE
            CourtDayCalendar cal = calendarRegistry.get(request.courtId(), day);

            // Member daily cap check
            if (request.memberId() != null) {
                OffsetDateTime dayStart = day.atStartOfDay(ClubTime.IST).toOffsetDateTime();
                OffsetDateTime dayEnd = day.plusDays(1).atStartOfDay(ClubTime.IST).toOffsetDateTime();
                int activeBookings = bookings.countActiveForMemberDay(
                        request.memberId(),
                        dayStart,
                        dayEnd,
                        List.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW")
                );

                if (activeBookings >= dailyCap) {
                    if (request.isOverrideCap() && currentActor.isManagerOrAbove()) {
                        // Manager override permitted
                    } else {
                        throw new DomainException(ErrorCode.CAP_EXCEEDED,
                                "Daily booking cap of " + dailyCap + " reached for member");
                    }
                }
            }

            // Slot check
            if (!cal.isFree(mask)) {
                // Expire stale holds on this court-day first
                releaseExpiredHoldsInternal(request.courtId(), day, cal);
                if (!cal.isFree(mask)) {
                    List<AlternativeSlots.CandidateSlot> alternatives = AlternativeSlots.suggest(
                            courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(court.getSport()),
                            Map.of(court.getId(), cal),
                            clubCalendarService.openStarts(day),
                            day,
                            LocalDate.now(clock.withZone(ClubTime.IST)),
                            LocalTime.now(clock.withZone(ClubTime.IST)).getHour() * 2 + LocalTime.now(clock.withZone(ClubTime.IST)).getMinute() / 30,
                            startSlot
                    );
                    throw new DomainException(ErrorCode.SLOT_TAKEN, "Slot is already occupied",
                            Map.of("alternatives", alternatives));
                }
            }

            boolean isFreePrice = quote.amount().isZero();
            boolean isDesk = channel == Channel.DESK;
            boolean isPayAtClub = "PAY_AT_CLUB".equalsIgnoreCase(paymentPolicy);

            String status = (isFreePrice || isDesk || isPayAtClub) ? "CONFIRMED" : "PENDING";
            String paymentStatus;
            if (isFreePrice) {
                paymentStatus = "PAID";
            } else if (isPayAtClub || isDesk) {
                paymentStatus = "DUE";
            } else {
                paymentStatus = "UNPAID";
            }

            int holdMinutes = getIntSetting("booking.auto_cancel_minutes", 5);
            OffsetDateTime expiresAt = "PENDING".equals(status) ? OffsetDateTime.now(clock).plusMinutes(holdMinutes) : null;

            // Phase 2: PERSIST
            return new Guard.Decision<>(
                    () -> {
                        Booking booking = new Booking();
                        booking.setCourt(court);
                        if (request.memberId() != null) {
                            Member member = members.findById(request.memberId()).orElse(null);
                            booking.setMember(member);
                        }
                        booking.setGuestName(request.guestName());
                        booking.setGuestPhone(request.guestPhone());
                        booking.setStartTime(start);
                        booking.setEndTime(end);
                        booking.setStatus(status);
                        booking.setPriceCharged(quote.amount().toRupees());
                        booking.setPaymentStatus(paymentStatus);
                        booking.setExpiresAt(expiresAt);
                        booking.setNotes(quote.breakdown());
                        booking.setPriceBreakdown(quote.breakdown());
                        booking.setPaymentPolicy(paymentPolicy);
                        booking.setSource(request.source() != null ? request.source() : "DIRECT");
                        booking.setCreatedBy(currentActor.userId());

                        bookings.save(booking);

                        // Record in occupancy ledger
                        occupancyService.recordBooking(court.getId(), booking.getId(), start, end, currentActor.userId());

                        // Record payment_due if applicable
                        if ("DUE".equals(paymentStatus)) {
                            PaymentDue due = new PaymentDue();
                            due.setRefType("BOOKING");
                            due.setRefId(booking.getId());
                            if (booking.getMember() != null) {
                                due.setMember(booking.getMember());
                            }
                            due.setAmount(quote.amount().toRupees());
                            due.setDueSince(OffsetDateTime.now(clock));
                            due.setStatus("OPEN");
                            paymentDueRepository.save(due);
                        }

                        if (request.isOverrideCap() && currentActor.isManagerOrAbove()) {
                            auditService.record("CAP_OVERRIDE", "BOOKING", booking.getId(),
                                    Map.of("reason", request.overrideReason() != null ? request.overrideReason() : "Manager override",
                                            "actor", currentActor.userId()));
                        }

                        return booking;
                    },
                    // Phase 3: APPLY
                    () -> {
                        if ("CONFIRMED".equals(status)) {
                            cal.occupyBooked(mask);
                        } else {
                            cal.occupyHeld(mask);
                        }

                        Instant now = clock.instant();
                        publisher.publish(new BookingEvents.BookingCreated(UUID.randomUUID(), now, court.getId(), day));
                        if ("CONFIRMED".equals(status)) {
                            publisher.publish(new BookingEvents.BookingConfirmed(UUID.randomUUID(), now, court.getId()));
                        }
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, court.getId(), day));
                    }
            );
        });
        return toResponse(created);
    }

    public BookingResponse cancel(UUID bookingId, String reason) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        if ("CANCELLED".equals(booking.getStatus())) {
            return toResponse(booking);
        }

        STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.CANCELLED, "Booking");

        LocalDate day = booking.getStartTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
        Keys.CourtDay courtKey = new Keys.CourtDay(booking.getCourt().getId(), day);

        int cancelFreeHours = getIntSetting("booking.cancel_free_hours", 4);
        BigDecimal lateRefundPercent = getBigDecimalSetting("booking.late_cancel_refund_percent", BigDecimal.ZERO);
        Actor actor = ActorHolder.current();
        boolean isStaff = actor.isManagerOrAbove() || "FRONT_DESK".equalsIgnoreCase(actor.role().name());

        Booking cancelled = guard.run(List.of(courtKey), () -> {
            Money refundAmount = CancellationPolicy.refundFor(
                    booking,
                    clock.instant(),
                    isStaff,
                    cancelFreeHours,
                    lateRefundPercent
            );

            int startSlot = booking.getStartTime().atZoneSameInstant(ClubTime.IST).getHour() * 2
                    + booking.getStartTime().atZoneSameInstant(ClubTime.IST).getMinute() / 30;
            long mask = SlotMask.session(startSlot);

            return new Guard.Decision<>(
                    () -> {
                        booking.setStatus("CANCELLED");
                        booking.setCancelReason(reason);
                        booking.setCancelledAt(OffsetDateTime.now(clock));
                        booking.setNotes((booking.getNotes() != null ? booking.getNotes() + "; " : "") + "Cancelled: " + reason);
                        bookings.save(booking);

                        occupancyService.releaseBooking(bookingId);
                        return booking;
                    },
                    () -> {
                        CourtDayCalendar cal = calendarRegistry.get(booking.getCourt().getId(), day);
                        cal.release(mask);

                        Instant now = clock.instant();
                        publisher.publish(new BookingEvents.BookingCancelled(UUID.randomUUID(), now, bookingId, refundAmount.toRupees()));
                        publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), now, booking.getCourt().getId(), day, startSlot));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, booking.getCourt().getId(), day));
                    }
            );
        });
        return toResponse(cancelled);
    }

    public BookingResponse reschedule(UUID bookingId, UUID newCourtId, LocalDate newDate, LocalTime newStartTime) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        if (!"CONFIRMED".equals(booking.getStatus()) && !"PENDING".equals(booking.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Only CONFIRMED or PENDING bookings can be rescheduled");
        }

        Court newCourt = (newCourtId != null)
                ? courts.findById(newCourtId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Target court not found"))
                : booking.getCourt();

        OffsetDateTime newStart = ZonedDateTime.of(newDate, newStartTime, ClubTime.IST).toOffsetDateTime();
        OffsetDateTime newEnd = newStart.plusMinutes(60);

        String tier = booking.getMember() == null ? "GUEST" : membershipService.tierAt(booking.getMember().getId(), newStart);
        int advanceDays = 7;
        if (booking.getMember() != null) {
            Optional<Plan> activePlan = membershipService.activePlan(booking.getMember().getId(), newDate);
            if (activePlan.isPresent()) {
                advanceDays = activePlan.get().getAdvanceBookingDays();
            }
        }
        SlotValidator.validate(newStart, advanceDays, clubCalendarService, clock);

        LocalDate oldDay = booking.getStartTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
        UUID oldCourtId = booking.getCourt().getId();
        int oldStartSlot = booking.getStartTime().atZoneSameInstant(ClubTime.IST).getHour() * 2
                + booking.getStartTime().atZoneSameInstant(ClubTime.IST).getMinute() / 30;
        long oldMask = SlotMask.session(oldStartSlot);

        int newStartSlot = newStartTime.getHour() * 2 + newStartTime.getMinute() / 30;
        long newMask = SlotMask.session(newStartSlot);

        List<Object> keys = new ArrayList<>();
        keys.add(new Keys.CourtDay(oldCourtId, oldDay));
        keys.add(new Keys.CourtDay(newCourt.getId(), newDate));
        if (booking.getMember() != null) {
            keys.add(new Keys.MemberDay(booking.getMember().getId(), newDate));
        }

        Booking rescheduled = guard.run(keys, () -> {
            CourtDayCalendar targetCal = calendarRegistry.get(newCourt.getId(), newDate);
            if (!targetCal.isFree(newMask)) {
                throw new DomainException(ErrorCode.SLOT_TAKEN, "Requested new slot is not free");
            }

            PriceQuote quote = pricingEngine.quote(newCourt.getId(), tier, newDate, newStartTime);

            return new Guard.Decision<>(
                    () -> {
                        occupancyService.releaseBooking(bookingId);
                        booking.setCourt(newCourt);
                        booking.setStartTime(newStart);
                        booking.setEndTime(newEnd);
                        booking.setPriceCharged(quote.amount().toRupees());
                        booking.setPriceBreakdown(quote.breakdown());
                        booking.setNotes((booking.getNotes() != null ? booking.getNotes() + "; " : "") + "Rescheduled");
                        bookings.save(booking);

                        occupancyService.recordBooking(newCourt.getId(), bookingId, newStart, newEnd, ActorHolder.current().userId());
                        return booking;
                    },
                    () -> {
                        CourtDayCalendar oldCal = calendarRegistry.get(oldCourtId, oldDay);
                        oldCal.release(oldMask);
                        targetCal.occupyBooked(newMask);

                        Instant now = clock.instant();
                        publisher.publish(new BookingEvents.BookingRescheduled(UUID.randomUUID(), now, bookingId));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, oldCourtId, oldDay));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, newCourt.getId(), newDate));
                    }
            );
        });
        return toResponse(rescheduled);
    }

    public BookingResponse checkIn(UUID bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.CHECKED_IN, "Booking");

        OffsetDateTime now = OffsetDateTime.now(clock);
        if (now.isBefore(booking.getStartTime().minusMinutes(30)) || now.isAfter(booking.getEndTime())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Check-in only permitted within [start - 30min, end]");
        }

        booking.setStatus("CHECKED_IN");
        bookings.save(booking);

        publisher.publish(new BookingEvents.BookingCheckedIn(UUID.randomUUID(), clock.instant(), bookingId));
        return toResponse(booking);
    }

    public BookingResponse markNoShow(UUID bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.NO_SHOW, "Booking");

        OffsetDateTime now = OffsetDateTime.now(clock);
        if (now.isBefore(booking.getStartTime())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Cannot mark NO_SHOW before session start time");
        }

        booking.setStatus("NO_SHOW");
        bookings.save(booking);

        publisher.publish(new BookingEvents.BookingNoShow(UUID.randomUUID(), clock.instant(), bookingId));
        return toResponse(booking);
    }

    public BookingResponse complete(UUID bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.COMPLETED, "Booking");

        booking.setStatus("COMPLETED");
        bookings.save(booking);
        return toResponse(booking);
    }

    /**
     * Package-private helper called from inside PaymentService's persist lambda.
     */
    public Runnable markPaidInTx(Booking booking) {
        booking.setStatus("CONFIRMED");
        booking.setExpiresAt(null);
        booking.setPaymentStatus("PAID");
        bookings.save(booking);

        LocalDate day = booking.getStartTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
        int startSlot = booking.getStartTime().atZoneSameInstant(ClubTime.IST).getHour() * 2
                + booking.getStartTime().atZoneSameInstant(ClubTime.IST).getMinute() / 30;
        long mask = SlotMask.session(startSlot);

        return () -> {
            CourtDayCalendar cal = calendarRegistry.get(booking.getCourt().getId(), day);
            cal.occupyBooked(mask);
            Instant now = clock.instant();
            publisher.publish(new BookingEvents.BookingConfirmed(UUID.randomUUID(), now, booking.getId()));
            publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, booking.getCourt().getId(), day));
        };
    }

    public int reapExpiredHolds() {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Booking> expired = bookings.findByStatusAndExpiresAtBefore("PENDING", now);
        int count = 0;

        for (Booking b : expired) {
            LocalDate day = b.getStartTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
            Keys.CourtDay key = new Keys.CourtDay(b.getCourt().getId(), day);

            guard.run(List.of(key), () -> {
                int startSlot = b.getStartTime().atZoneSameInstant(ClubTime.IST).getHour() * 2
                        + b.getStartTime().atZoneSameInstant(ClubTime.IST).getMinute() / 30;
                long mask = SlotMask.session(startSlot);

                return new Guard.Decision<>(
                        () -> {
                            b.setStatus("EXPIRED");
                            b.setExpiresAt(null);
                            bookings.save(b);
                            occupancyService.releaseBooking(b.getId());
                            return true;
                        },
                        () -> {
                            CourtDayCalendar cal = calendarRegistry.get(b.getCourt().getId(), day);
                            cal.release(mask);
                            Instant instantNow = clock.instant();
                            publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), instantNow, b.getCourt().getId(), day, startSlot));
                            publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), instantNow, b.getCourt().getId(), day));
                        }
                );
            });
            count++;
        }
        return count;
    }

    @Transactional(readOnly = true)
    public BookingResponse get(UUID bookingId) {
        Booking booking = bookings.findDetailedById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listForMember(UUID memberId) {
        return bookings.findDetailedByMember(memberId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void releaseExpiredHoldsInternal(UUID courtId, LocalDate day, CourtDayCalendar cal) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Booking> expired = bookings.findByCourt_IdAndStatusAndExpiresAtBefore(courtId, "PENDING", now);
        for (Booking b : expired) {
            LocalDate bDay = b.getStartTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
            if (bDay.equals(day)) {
                b.setStatus("EXPIRED");
                b.setExpiresAt(null);
                bookings.save(b);
                occupancyService.releaseBooking(b.getId());

                int s = b.getStartTime().atZoneSameInstant(ClubTime.IST).getHour() * 2
                        + b.getStartTime().atZoneSameInstant(ClubTime.IST).getMinute() / 30;
                cal.release(SlotMask.session(s));
                publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), clock.instant(), courtId, day, s));
            }
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return mapper.toResponse(booking);
    }

    private int getIntSetting(String key, int defaultValue) {
        return clubSettingRepository.findByKey(key)
                .map(s -> {
                    try { return Integer.parseInt(s.getValue()); } catch (Exception ignored) { return defaultValue; }
                })
                .orElse(defaultValue);
    }

    private BigDecimal getBigDecimalSetting(String key, BigDecimal defaultValue) {
        return clubSettingRepository.findByKey(key)
                .map(s -> {
                    try { return new BigDecimal(s.getValue()); } catch (Exception ignored) { return defaultValue; }
                })
                .orElse(defaultValue);
    }

    private static Channel parseChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return Channel.ONLINE;
        }
        try {
            return Channel.valueOf(channel.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Channel.ONLINE;
        }
    }
}
