package com.bookmycourt.booking.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.Model.Channel;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.enums.BookingStatus;
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
import com.bookmycourt.common.money.Money;
import com.bookmycourt.common.state.StateMachine;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.facility.service.SlotValidator;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.service.MembershipService;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.entity.PaymentDue;
import com.bookmycourt.payment.entity.Refund;
import com.bookmycourt.payment.repository.PaymentDueRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import com.bookmycourt.payment.repository.RefundRepository;
import com.bookmycourt.pricing.service.PriceQuote;
import com.bookmycourt.pricing.service.PricingEngine;
import com.bookmycourt.social.repository.SocialParticipantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    /**
     * Statuses that count toward the member's daily cap (SRS BKG-08: confirmed
     * + pending; cancelled/no-show excluded).
     */
    private static final List<String> CAP_STATUSES = List.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED");

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
    private final SocialParticipantRepository socialParticipantRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;

    private static final StateMachine<BookingStatus> STATE_MACHINE = StateMachine.of(BookingStatus.class)
            .allow(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.EXPIRED, BookingStatus.CANCELLED)
            .allow(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW)
            .allow(BookingStatus.CHECKED_IN, BookingStatus.COMPLETED)
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
            Clock clock,
            SocialParticipantRepository socialParticipantRepository,
            PaymentRepository paymentRepository,
            RefundRepository refundRepository
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
        this.socialParticipantRepository = socialParticipantRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
    }

    // =====================================================================
    // Access helpers
    // =====================================================================
    private static boolean isStaff(Actor a) {
        return a != null && (a.isManagerOrAbove() || "FRONT_DESK".equalsIgnoreCase(a.role().name()));
    }

    private static DomainException forbidden(String msg) {
        // If your ErrorCode enum has no FORBIDDEN, add it (maps to HTTP 403) or reuse your existing access-denied code.
        return new DomainException(ErrorCode.FORBIDDEN, msg);
    }

    public void assertStaff() {
        if (!isStaff(ActorHolder.current())) {
            throw forbidden("Staff access required");
        }
    }

    public void assertManager() {
        Actor a = ActorHolder.current();
        if (a == null || !a.isManagerOrAbove()) {
            throw forbidden("Manager access required");
        }
    }

    /**
     * Staff may act on any member. A member may only act on themselves. ADAPT:
     * assumes Member exposes getUserId() (SRS member.user_id). Change to match
     * your entity.
     */
    private Member requireMemberAccess(Actor actor, UUID memberId) {
        Member member = members.findById(memberId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Member not found"));
        if (isStaff(actor)) {
            return member;
        }
        if (actor == null || actor.userId() == null || !actor.userId().equals(member.getUserId())) {
            throw forbidden("You can only manage your own bookings");
        }
        return member;
    }

    private void requireOwnerOrStaff(Actor actor, Booking booking) {
        if (isStaff(actor)) {
            return;
        }
        if (booking.getMember() == null) {
            throw forbidden("Only staff can manage guest bookings");
        }
        requireMemberAccess(actor, booking.getMember().getId());
    }

    private static int slotOf(OffsetDateTime t) {
        ZonedDateTime z = t.atZoneSameInstant(ClubTime.IST);
        return z.getHour() * 2 + z.getMinute() / 30;
    }

    private static LocalDate dayOf(OffsetDateTime t) {
        return t.atZoneSameInstant(ClubTime.IST).toLocalDate();
    }

    private static LocalTime parseStartTime(String raw) {
        LocalTime t;
        try {
            t = LocalTime.parse(raw);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "startTime must be HH:mm");
        }
        if (t.getMinute() % 30 != 0 || t.getSecond() != 0 || t.getNano() != 0) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Bookings must start on a :00 or :30 boundary");
        }
        return t;
    }

    private static String courtDayLock(UUID courtId, LocalDate day) {
        return "court:" + courtId + ":" + day;
    }

    private static String memberDayLock(UUID memberId, LocalDate day) {
        return "member:" + memberId + ":" + day;
    }

    // =====================================================================
    // Create
    // =====================================================================
    public BookingResponse create(CreateBookingRequest request) {
        Actor actor = ActorHolder.current();
        boolean staff = isStaff(actor);

        Court court = courts.findById(request.courtId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found"));
        if (!court.isActive()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Court is inactive");
        }

        LocalTime startTime = parseStartTime(request.startTime());
        OffsetDateTime start = ZonedDateTime.of(request.date(), startTime, ClubTime.IST).toOffsetDateTime();
        int slotDuration = court.getSlotDurationMinutes() > 0 ? court.getSlotDurationMinutes() : 60;
        OffsetDateTime end = start.plusMinutes(slotDuration);

        final Member member;
        if (request.memberId() != null) {
            member = requireMemberAccess(actor, request.memberId());
        } else {
            member = null;
            if (request.guestName() == null || request.guestName().isBlank()) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "A member or guest name is required");
            }
            if (request.guestPhone() == null || request.guestPhone().isBlank()) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Guest phone is required");
            }
        }

        // Payment-related fields are only honoured for staff. Everyone else is forced to online pay-now.
        final Channel channel = staff ? parseChannel(request.channel()) : Channel.ONLINE;
        final String paymentPolicy = (staff && request.paymentPolicy() != null)
                ? request.paymentPolicy().toUpperCase(Locale.ROOT) : "PAY_NOW";

        boolean wantsOverride = request.isOverrideCap();
        if (wantsOverride && (actor == null || !actor.isManagerOrAbove())) {
            throw forbidden("Only a manager can override the daily cap");
        }
        if (wantsOverride && (request.overrideReason() == null || request.overrideReason().isBlank())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A reason is required to override the daily cap");
        }
        final boolean overrideCap = wantsOverride;

        LocalDate day = request.date();
        Optional<Plan> activePlan = (member != null)
                ? membershipService.activePlan(member.getId(), day)
                : Optional.empty();
        int advanceDays = activePlan.map(Plan::getAdvanceBookingDays).orElse(7);

        String tier = (member == null) ? "GUEST" : membershipService.tierAt(member.getId(), start);
        SlotValidator.validate(start, advanceDays, clubCalendarService, clock);

        final int startSlot = slotOf(start);
        final long mask = SlotMask.session(startSlot);

        PriceQuote quote = pricingEngine.quote(request.courtId(), tier, day, startTime);

        int cap = getIntSetting("booking.default_daily_cap", 2);
        if (activePlan.isPresent() && activePlan.get().getMaxBookingsPerDay() > 0) {
            cap = activePlan.get().getMaxBookingsPerDay();
        }
        final int dailyCap = cap;

        List<Object> keys = new ArrayList<>();
        if (member != null) {
            keys.add(new Keys.MemberDay(member.getId(), day));
        }
        keys.add(new Keys.CourtDay(request.courtId(), day));

        final UUID actorId = actor == null ? null : actor.userId();

        Booking created = guard.run(keys, () -> {
            // ---- Phase 1: DECIDE (fast, in-memory, friendly errors) ----
            CourtDayCalendar cal = calendarRegistry.get(request.courtId(), day);

            if (member != null) {
                enforceCap(member.getId(), day, dailyCap, overrideCap);
            }

            if (!cal.isFree(mask)) {
                releaseExpiredHoldsInternal(request.courtId(), day, cal);
                if (!cal.isFree(mask)) {
                    throw slotTaken(court, day, startSlot);
                }
            }

            boolean isFreePrice = quote.amount().isZero();
            boolean isDesk = channel == Channel.DESK;
            boolean isPayAtClub = "PAY_AT_CLUB".equalsIgnoreCase(paymentPolicy);

            String status = (isFreePrice || isDesk || isPayAtClub) ? "CONFIRMED" : "PENDING";
            String paymentStatus;
            if (isFreePrice) {
                paymentStatus = "PAID"; 
            }else if (isPayAtClub || isDesk) {
                paymentStatus = "DUE"; 
            }else {
                paymentStatus = "UNPAID";
            }

            int holdMinutes = getIntSetting("booking.auto_cancel_minutes", 5);
            OffsetDateTime expiresAt = "PENDING".equals(status) ? OffsetDateTime.now(clock).plusMinutes(holdMinutes) : null;

            // ---- Phase 2: PERSIST (one DB transaction; authoritative checks under DB locks) ----
            return new Guard.Decision<>(
                    () -> {
                        // Serialise on the DB so correctness holds even if a second JVM ever runs.
                        // Fixed order (member, then court) avoids deadlocks.
                        if (member != null) {
                            occupancyService.lockKey(memberDayLock(member.getId(), day));
                        }
                        occupancyService.lockKey(courtDayLock(court.getId(), day));

                        if (member != null) {
                            enforceCap(member.getId(), day, dailyCap, overrideCap);
                        }
                        if (!occupancyService.isRangeFree(court.getId(), start, end)) {
                            throw slotTaken(court, day, startSlot);
                        }

                        Booking booking = new Booking();
                        booking.setCourt(court);
                        booking.setMember(member);
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
                        booking.setCreatedBy(actorId);
                        bookings.save(booking);

                        try {
                            // Last line of defence: Postgres EXCLUDE constraint on (court_id, occupied_period).
                            occupancyService.recordBooking(court.getId(), booking.getId(), start, end, actorId);
                        } catch (DataIntegrityViolationException ex) {
                            throw new DomainException(ErrorCode.SLOT_TAKEN,
                                    "Slot was just taken by another booking", Map.of("alternatives", List.of()));
                        }

                        if ("DUE".equals(paymentStatus)) {
                            PaymentDue due = new PaymentDue();
                            due.setRefType("BOOKING");
                            due.setRefId(booking.getId());
                            if (member != null) {
                                due.setMember(member);
                            }
                            due.setAmount(quote.amount().toRupees());
                            due.setDueSince(OffsetDateTime.now(clock));
                            due.setStatus("OPEN");
                            paymentDueRepository.save(due);
                        }

                        if (overrideCap) {
                            auditService.record("CAP_OVERRIDE", "BOOKING", booking.getId(),
                                    Map.of("reason", request.overrideReason(), "actor", String.valueOf(actorId)));
                        }
                        return booking;
                    },
                    // ---- Phase 3: APPLY (memory + events, only after commit succeeded) ----
                    () -> {
                        if ("CONFIRMED".equals(status)) {
                            cal.occupyBooked(mask); 
                        }else {
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

    private void enforceCap(UUID memberId, LocalDate day, int dailyCap, boolean overrideCap) {
        if (overrideCap) {
            return;
        }
        int active = bookings.countActiveForMemberDay(memberId, day, CAP_STATUSES);
        Instant dayStart = day.atStartOfDay(ClubTime.IST).toInstant();
        Instant dayEnd = day.plusDays(1).atStartOfDay(ClubTime.IST).toInstant();
        int joinedSocials = socialParticipantRepository.countJoinedForMemberDay(memberId, dayStart, dayEnd);
        if (active + joinedSocials >= dailyCap) {
            throw new DomainException(ErrorCode.CAP_EXCEEDED, "Daily booking cap of " + dailyCap + " reached for member");
        }
    }

    /**
     * Builds SLOT_TAKEN with correct alternatives: every same-sport court uses
     * its OWN calendar.
     */
    private DomainException slotTaken(Court court, LocalDate day, int requestedSlot) {
        List<Court> sameSport = courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(court.getSport());
        Map<UUID, CourtDayCalendar> cals = new HashMap<>();
        for (Court c : sameSport) {
            cals.put(c.getId(), calendarRegistry.get(c.getId(), day));
        }
        ZonedDateTime now = ZonedDateTime.now(clock.withZone(ClubTime.IST));
        List<AlternativeSlots.CandidateSlot> alternatives = AlternativeSlots.suggest(
                sameSport,
                cals,
                clubCalendarService.openStarts(day),
                day,
                now.toLocalDate(),
                now.getHour() * 2 + now.getMinute() / 30,
                requestedSlot
        );
        return new DomainException(ErrorCode.SLOT_TAKEN, "Slot is already occupied", Map.of("alternatives", alternatives));
    }

    // =====================================================================
    // Cancel
    // =====================================================================
    public BookingResponse cancel(UUID bookingId, String reason) {
        Actor actor = ActorHolder.current();
        boolean staff = isStaff(actor);

        Booking pre = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));
        requireOwnerOrStaff(actor, pre);

        if ("CANCELLED".equals(pre.getStatus())) {
            return toResponse(pre);
        }
        if (!staff && !OffsetDateTime.now(clock).isBefore(pre.getStartTime())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A session that has already started cannot be cancelled");
        }

        LocalDate day = dayOf(pre.getStartTime());
        UUID courtId = pre.getCourt().getId();
        int cancelFreeHours = getIntSetting("booking.cancel_free_hours", 4);
        BigDecimal lateRefundPercent = getBigDecimalSetting("booking.late_cancel_refund_percent", BigDecimal.ZERO);

        Booking cancelled = guard.run(List.of(new Keys.CourtDay(courtId, day)), () -> {
            Booking booking = bookings.findById(bookingId)
                    .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));
            if ("CANCELLED".equals(booking.getStatus())) {
                return Guard.Decision.noop(booking);
            }
            STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.CANCELLED, "Booking");

            boolean wasPaid = "PAID".equals(booking.getPaymentStatus());
            Money refund = wasPaid
                    ? CancellationPolicy.refundFor(booking, clock.instant(), staff, cancelFreeHours, lateRefundPercent)
                    : Money.ZERO;

            int startSlot = slotOf(booking.getStartTime());
            long mask = SlotMask.session(startSlot);

            return new Guard.Decision<>(
                    () -> {
                        occupancyService.lockKey(courtDayLock(courtId, day));
                        booking.setStatus("CANCELLED");
                        booking.setCancelReason(reason);
                        booking.setCancelledAt(OffsetDateTime.now(clock));
                        booking.setNotes((booking.getNotes() != null ? booking.getNotes() + "; " : "") + "Cancelled: " + reason);
                        if (refund.isPositive()) {
                            booking.setPaymentStatus("REFUNDED");
                            paymentRepository.findBySourceTypeAndSourceId("BOOKING", bookingId).stream()
                                    .filter(p -> "PAID".equalsIgnoreCase(p.getStatus()))
                                    .findFirst()
                                    .ifPresent(p -> {
                                Refund ref = new Refund();
                                ref.setPayment(p);
                                ref.setAmount(refund.toRupees());
                                ref.setReason("Booking cancellation: " + (reason != null ? reason : ""));
                                ref.setStatus("PROCESSED");
                                ref.setReference("REF-" + UUID.randomUUID().toString().substring(0, 8));
                                ref.setProcessedAt(Instant.now(clock));
                                refundRepository.save(ref);

                                p.setRefundedTotal(p.getRefundedTotal().add(refund.toRupees()));
                                if (p.getRefundedTotal().compareTo(p.getAmount()) >= 0) {
                                    p.setStatus("REFUNDED");
                                } else {
                                    p.setStatus("PARTIALLY_REFUNDED");
                                }
                                paymentRepository.save(p);
                            });
                        }
                        bookings.save(booking);
                        occupancyService.releaseBooking(bookingId);

                        // Stop the club chasing a payment for a booking that no longer exists.
                        // ADAPT: add `List<PaymentDue> findByRefTypeAndRefId(String refType, UUID refId);` to PaymentDueRepository.
                        for (PaymentDue due : paymentDueRepository.findByRefTypeAndRefId("BOOKING", bookingId)) {
                            if ("OPEN".equals(due.getStatus())) {
                                due.setStatus("VOID");
                                paymentDueRepository.save(due);
                            }
                        }
                        return booking;
                    },
                    () -> {
                        CourtDayCalendar cal = calendarRegistry.get(courtId, day);
                        cal.releaseBooked(mask);
                        cal.releaseHeld(mask);

                        Instant now = clock.instant();
                        publisher.publish(new BookingEvents.BookingCancelled(UUID.randomUUID(), now, bookingId, refund.toRupees()));
                        publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), now, courtId, day, startSlot));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, courtId, day));
                    }
            );
        });
        return toResponse(cancelled);
    }

    // =====================================================================
    // Reschedule (atomic: old slot only released if the new one is secured)
    // =====================================================================
    public BookingResponse reschedule(UUID bookingId, UUID newCourtId, LocalDate newDate, LocalTime newStartTime) {
        if (newDate == null || newStartTime == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "newDate and newStartTime are required");
        }
        if (newStartTime.getMinute() % 30 != 0 || newStartTime.getSecond() != 0 || newStartTime.getNano() != 0) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Bookings must start on a :00 or :30 boundary");
        }

        Actor actor = ActorHolder.current();
        Booking pre = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));
        requireOwnerOrStaff(actor, pre);

        if (!"CONFIRMED".equals(pre.getStatus()) && !"PENDING".equals(pre.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Only CONFIRMED or PENDING bookings can be rescheduled");
        }

        final Court newCourt = (newCourtId != null)
                ? courts.findById(newCourtId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Target court not found"))
                : pre.getCourt();
        if (!newCourt.isActive()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Court is inactive");
        }

        OffsetDateTime newStart = ZonedDateTime.of(newDate, newStartTime, ClubTime.IST).toOffsetDateTime();
        OffsetDateTime newEnd = newStart.plusMinutes(60);

        UUID memberId = pre.getMember() == null ? null : pre.getMember().getId();
        String tier = memberId == null ? "GUEST" : membershipService.tierAt(memberId, newStart);
        int advanceDays = 7;
        int cap = getIntSetting("booking.default_daily_cap", 2);
        if (memberId != null) {
            Optional<Plan> plan = membershipService.activePlan(memberId, newDate);
            if (plan.isPresent()) {
                advanceDays = plan.get().getAdvanceBookingDays();
                if (plan.get().getMaxBookingsPerDay() > 0) {
                    cap = plan.get().getMaxBookingsPerDay();
                }
            }
        }
        final int dailyCap = cap;
        SlotValidator.validate(newStart, advanceDays, clubCalendarService, clock);

        final LocalDate oldDay = dayOf(pre.getStartTime());
        final UUID oldCourtId = pre.getCourt().getId();
        final long oldMask = SlotMask.session(slotOf(pre.getStartTime()));
        final int newStartSlot = newStartTime.getHour() * 2 + newStartTime.getMinute() / 30;
        final long newMask = SlotMask.session(newStartSlot);
        final int oldStartSlot = slotOf(pre.getStartTime());
        final boolean sameCalendar = oldCourtId.equals(newCourt.getId()) && oldDay.equals(newDate);

        if (sameCalendar && oldStartSlot == newStartSlot) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "New slot is the same as the current slot");
        }

        List<Object> rawKeys = new ArrayList<>();
        rawKeys.add(new Keys.CourtDay(oldCourtId, oldDay));
        rawKeys.add(new Keys.CourtDay(newCourt.getId(), newDate));
        if (memberId != null) {
            rawKeys.add(new Keys.MemberDay(memberId, newDate));
        }
        List<Object> keys = new ArrayList<>(new LinkedHashSet<>(rawKeys));
        keys.sort(Comparator.comparing(Object::toString)); // stable lock order -> no deadlocks

        final UUID actorId = actor == null ? null : actor.userId();

        Booking rescheduled = guard.run(keys, () -> {
            Booking booking = bookings.findById(bookingId)
                    .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));
            if (!"CONFIRMED".equals(booking.getStatus()) && !"PENDING".equals(booking.getStatus())) {
                throw new DomainException(ErrorCode.INVALID_STATE, "Booking changed state; reschedule not possible");
            }
            final String status = booking.getStatus();

            CourtDayCalendar targetCal = calendarRegistry.get(newCourt.getId(), newDate);
            // A booking must not collide with its own old slot when moving within the same court-day.
            long needed = sameCalendar ? (newMask & ~oldMask) : newMask;
            if (!targetCal.isFree(needed)) {
                throw slotTaken(newCourt, newDate, newStartSlot);
            }
            if (memberId != null && !oldDay.equals(newDate)) {
                enforceCap(memberId, newDate, dailyCap, false);
            }

            final boolean paid = "PAID".equals(booking.getPaymentStatus());
            // BKG-16: paid bookings keep their paid price.
            final PriceQuote quote = paid ? null : pricingEngine.quote(newCourt.getId(), tier, newDate, newStartTime);

            return new Guard.Decision<>(
                    () -> {
                        if (memberId != null) {
                            occupancyService.lockKey(memberDayLock(memberId, newDate));
                        }
                        // consistent order across both court-days
                        List<String> courtLocks = new ArrayList<>(new LinkedHashSet<>(List.of(
                                courtDayLock(oldCourtId, oldDay), courtDayLock(newCourt.getId(), newDate))));
                        courtLocks.sort(Comparator.naturalOrder());
                        courtLocks.forEach(occupancyService::lockKey);

                        if (memberId != null && !oldDay.equals(newDate)) {
                            enforceCap(memberId, newDate, dailyCap, false);
                        }

                        occupancyService.releaseBooking(bookingId);
                        if (!occupancyService.isRangeFree(newCourt.getId(), newStart, newEnd)) {
                            throw slotTaken(newCourt, newDate, newStartSlot); // tx rolls back -> old slot intact
                        }

                        booking.setCourt(newCourt);
                        booking.setStartTime(newStart);
                        booking.setEndTime(newEnd);
                        String note = "Rescheduled";
                        if (!paid) {
                            booking.setPriceCharged(quote.amount().toRupees());
                            booking.setPriceBreakdown(quote.breakdown());
                            for (PaymentDue due : paymentDueRepository.findByRefTypeAndRefId("BOOKING", bookingId)) {
                                if ("OPEN".equals(due.getStatus())) {
                                    due.setAmount(quote.amount().toRupees());
                                    paymentDueRepository.save(due);
                                }
                            }
                        } else {
                            note = "Rescheduled (paid price retained)";
                        }
                        booking.setNotes((booking.getNotes() != null ? booking.getNotes() + "; " : "") + note);
                        bookings.save(booking);

                        try {
                            occupancyService.recordBooking(newCourt.getId(), bookingId, newStart, newEnd, actorId);
                        } catch (DataIntegrityViolationException ex) {
                            throw new DomainException(ErrorCode.SLOT_TAKEN, "Requested new slot was just taken",
                                    Map.of("alternatives", List.of()));
                        }
                        return booking;
                    },
                    () -> {
                        CourtDayCalendar oldCal = calendarRegistry.get(oldCourtId, oldDay);
                        oldCal.releaseBooked(oldMask);
                        oldCal.releaseHeld(oldMask);
                        if ("PENDING".equals(status)) {
                            targetCal.occupyHeld(newMask); 
                        }else {
                            targetCal.occupyBooked(newMask);
                        }

                        Instant now = clock.instant();
                        publisher.publish(new BookingEvents.BookingRescheduled(UUID.randomUUID(), now, bookingId));
                        publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), now, oldCourtId, oldDay, oldStartSlot));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, oldCourtId, oldDay));
                        publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, newCourt.getId(), newDate));
                    }
            );
        });
        return toResponse(rescheduled);
    }

    // =====================================================================
    // Front-desk lifecycle
    // =====================================================================
    public BookingResponse checkIn(UUID bookingId) {
        assertStaff();
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
        assertStaff();
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.NO_SHOW, "Booking");

        if (OffsetDateTime.now(clock).isBefore(booking.getStartTime())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Cannot mark NO_SHOW before session start time");
        }

        booking.setStatus("NO_SHOW");
        bookings.save(booking);
        publisher.publish(new BookingEvents.BookingNoShow(UUID.randomUUID(), clock.instant(), bookingId));
        return toResponse(booking);
    }

    public BookingResponse complete(UUID bookingId) {
        assertStaff();
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));

        STATE_MACHINE.check(BookingStatus.valueOf(booking.getStatus()), BookingStatus.COMPLETED, "Booking");

        booking.setStatus("COMPLETED");
        bookings.save(booking);
        return toResponse(booking);
    }

    // =====================================================================
    // Payment confirmation (called inside PaymentService's persist lambda)
    // =====================================================================
    public Runnable markPaidInTx(Booking booking) {
        if (!"PENDING".equals(booking.getStatus())) {
            // Late webhook after expiry/cancel: PaymentService must refund instead of confirming.
            throw new DomainException(ErrorCode.INVALID_STATE,
                    "Booking is no longer awaiting payment (status=" + booking.getStatus() + ")");
        }
        if (!occupancyService.isActiveForBooking(booking.getId())) {
            throw new DomainException(ErrorCode.INVALID_STATE,
                    "Hold was released and the slot may have been re-booked; payment must be refunded");
        }

        booking.setStatus("CONFIRMED");
        booking.setExpiresAt(null);
        booking.setPaymentStatus("PAID");
        bookings.save(booking);

        LocalDate day = dayOf(booking.getStartTime());
        UUID courtId = booking.getCourt().getId();
        UUID id = booking.getId();
        long mask = SlotMask.session(slotOf(booking.getStartTime()));

        return () -> {
            CourtDayCalendar cal = calendarRegistry.get(courtId, day);
            cal.occupyBooked(mask); // also clears the held bit
            Instant now = clock.instant();
            publisher.publish(new BookingEvents.BookingConfirmed(UUID.randomUUID(), now, id));
            publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), now, courtId, day));
        };
    }

    // =====================================================================
    // Hold reaper
    // =====================================================================
    public int reapExpiredHolds() {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Booking> expired = bookings.findByStatusAndExpiresAtBefore("PENDING", now);
        int count = 0;

        for (Booking candidate : expired) {
            try {
                UUID id = candidate.getId();
                UUID courtId = candidate.getCourt().getId();
                LocalDate day = dayOf(candidate.getStartTime());

                boolean reaped = guard.run(List.of(new Keys.CourtDay(courtId, day)), () -> {
                    // Re-read under the lock: a payment may have confirmed it a moment ago.
                    Booking b = bookings.findById(id).orElse(null);
                    OffsetDateTime n = OffsetDateTime.now(clock);
                    if (b == null || !"PENDING".equals(b.getStatus())
                            || b.getExpiresAt() == null || b.getExpiresAt().isAfter(n)) {
                        return Guard.Decision.noop(false);
                    }
                    int startSlot = slotOf(b.getStartTime());
                    long mask = SlotMask.session(startSlot);
                    return new Guard.Decision<>(
                            () -> {
                                occupancyService.lockKey(courtDayLock(courtId, day));
                                b.setStatus("EXPIRED");
                                b.setExpiresAt(null);
                                bookings.save(b);
                                occupancyService.releaseBooking(b.getId());
                                return true;
                            },
                            () -> {
                                CourtDayCalendar cal = calendarRegistry.get(courtId, day);
                                cal.releaseHeld(mask);
                                Instant t = clock.instant();
                                publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), t, courtId, day, startSlot));
                                publisher.publish(new BookingEvents.BookingChanged(UUID.randomUUID(), t, courtId, day));
                            }
                    );
                });
                if (reaped) {
                    count++;
                }
            } catch (Exception e) {
                log.warn("Could not expire hold {}: {}", candidate.getId(), e.getMessage());
            }
        }
        return count;
    }

    // =====================================================================
    // Reads
    // =====================================================================
    @Transactional(readOnly = true)
    public BookingResponse get(UUID bookingId) {
        Booking booking = bookings.findDetailedById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Booking not found"));
        requireOwnerOrStaff(ActorHolder.current(), booking);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listForMember(UUID memberId) {
        requireMemberAccess(ActorHolder.current(), memberId);
        return bookings.findDetailedByMember(memberId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listBookings(UUID memberId, UUID courtId, LocalDate date) {
        if (memberId != null) {
            return listForMember(memberId);
        }
        if (courtId != null && date != null) {
            return bookings.findDetailedByCourtAndDay(courtId, date).stream()
                    .map(this::toResponse)
                    .toList();
        }
        if (date != null) {
            return bookings.findDetailedByDay(date).stream()
                    .map(this::toResponse)
                    .toList();
        }
        if (courtId != null) {
            return bookings.findDetailedByCourt(courtId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return bookings.findAllDetailed().stream()
                .map(this::toResponse)
                .toList();
    }

    // =====================================================================
    // Internals
    // =====================================================================
    /**
     * Called from DECIDE while the court-day lock is held. Only touches
     * genuinely expired PENDING holds.
     */
    private void releaseExpiredHoldsInternal(UUID courtId, LocalDate day, CourtDayCalendar cal) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Booking> expired = bookings.findByCourt_IdAndStatusAndExpiresAtBefore(courtId, "PENDING", now);
        for (Booking b : expired) {
            if (!dayOf(b.getStartTime()).equals(day)) {
                continue;
            }
            try {
                b.setStatus("EXPIRED");
                b.setExpiresAt(null);
                bookings.save(b);
                occupancyService.releaseBooking(b.getId());

                int s = slotOf(b.getStartTime());
                cal.releaseHeld(SlotMask.session(s));
                publisher.publish(new BookingEvents.SlotReleased(UUID.randomUUID(), clock.instant(), courtId, day, s));
            } catch (Exception e) {
                log.warn("Inline hold release failed for {}: {}", b.getId(), e.getMessage());
            }
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return mapper.toResponse(booking);
    }

    private int getIntSetting(String key, int defaultValue) {
        return clubSettingRepository.findByKey(key)
                .map(s -> {
                    try {
                        return Integer.parseInt(s.getValue());
                    } catch (Exception ignored) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    private BigDecimal getBigDecimalSetting(String key, BigDecimal defaultValue) {
        return clubSettingRepository.findByKey(key)
                .map(s -> {
                    try {
                        return new BigDecimal(s.getValue());
                    } catch (Exception ignored) {
                        return defaultValue;
                    }
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
