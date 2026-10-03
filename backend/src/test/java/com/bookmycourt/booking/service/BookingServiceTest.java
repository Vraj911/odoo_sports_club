package com.bookmycourt.booking.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.mapper.BookingMapper;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.actor.ActorRole;
import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.service.MembershipService;
import com.bookmycourt.payment.entity.Payment;
import com.bookmycourt.payment.entity.Refund;
import com.bookmycourt.payment.repository.PaymentDueRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import com.bookmycourt.payment.repository.RefundRepository;
import com.bookmycourt.pricing.service.PricingEngine;
import com.bookmycourt.social.repository.SocialParticipantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingServiceTest {

    private BookingRepository bookings;
    private CourtRepository courts;
    private MemberRepository members;
    private PricingEngine pricingEngine;
    private MembershipService membershipService;
    private ClubCalendarService clubCalendarService;
    private CalendarRegistry calendarRegistry;
    private OccupancyService occupancyService;
    private PaymentDueRepository paymentDueRepository;
    private ClubSettingRepository clubSettingRepository;
    private AuditService auditService;
    private DomainEventPublisher publisher;
    private Guard guard;
    private SocialParticipantRepository socialParticipantRepository;
    private PaymentRepository paymentRepository;
    private RefundRepository refundRepository;
    private BookingService service;

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-10-05T08:00:00Z"),
            ClubTime.IST
    );

    @BeforeEach
    void setUp() {
        bookings = Mockito.mock(BookingRepository.class);
        courts = Mockito.mock(CourtRepository.class);
        members = Mockito.mock(MemberRepository.class);
        pricingEngine = Mockito.mock(PricingEngine.class);
        membershipService = Mockito.mock(MembershipService.class);
        clubCalendarService = Mockito.mock(ClubCalendarService.class);
        calendarRegistry = Mockito.mock(CalendarRegistry.class);
        occupancyService = Mockito.mock(OccupancyService.class);
        paymentDueRepository = Mockito.mock(PaymentDueRepository.class);
        clubSettingRepository = Mockito.mock(ClubSettingRepository.class);
        auditService = Mockito.mock(AuditService.class);
        publisher = Mockito.mock(DomainEventPublisher.class);
        guard = Mockito.mock(Guard.class);
        socialParticipantRepository = Mockito.mock(SocialParticipantRepository.class);
        paymentRepository = Mockito.mock(PaymentRepository.class);
        refundRepository = Mockito.mock(RefundRepository.class);
        BookingMapper mapper = new BookingMapper(courts);

        when(guard.run(any(), any())).thenAnswer(invocation -> {
            Supplier<Guard.Decision<?>> supplier = invocation.getArgument(1);
            Guard.Decision<?> d = supplier.get();
            Object res = d.persist().get();
            d.apply().run();
            return res;
        });

        service = new BookingService(
                bookings, courts, members, mapper, pricingEngine,
                membershipService, clubCalendarService, calendarRegistry,
                occupancyService, paymentDueRepository, clubSettingRepository,
                auditService, publisher, guard, FIXED_CLOCK,
                socialParticipantRepository, paymentRepository, refundRepository
        );
    }

    @Test
    void cancel_paidBooking_createsRefundRecordAndUpdatesPayment() {
        UUID bookingId = UUID.randomUUID();
        UUID courtId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        Court court = new Court();
        court.setId(courtId);

        UUID userId = UUID.randomUUID();
        com.bookmycourt.membership.entity.AppUser appUser = new com.bookmycourt.membership.entity.AppUser();
        appUser.setId(userId);

        Member member = new Member();
        member.setId(memberId);
        member.setUser(appUser);

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setCourt(court);
        booking.setMember(member);
        booking.setStatus("CONFIRMED");
        booking.setPaymentStatus("PAID");
        booking.setPriceCharged(new BigDecimal("500.00"));
        // Start time 48 hours in the future -> 100% refund
        booking.setStartTime(OffsetDateTime.now(FIXED_CLOCK).plusDays(2));
        booking.setEndTime(booking.getStartTime().plusMinutes(60));

        when(bookings.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookings.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(members.findById(memberId)).thenReturn(Optional.of(member));
        when(calendarRegistry.get(any(), any())).thenReturn(Mockito.mock(com.bookmycourt.booking.engine.CourtDayCalendar.class));

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setStatus("PAID");
        payment.setAmount(new BigDecimal("500.00"));
        payment.setRefundedTotal(BigDecimal.ZERO);
        payment.setSourceType("BOOKING");
        payment.setSourceId(bookingId);

        when(paymentRepository.findBySourceTypeAndSourceId("BOOKING", bookingId))
                .thenReturn(List.of(payment));

        ActorHolder.set(new Actor(userId, "Member User", ActorRole.MEMBER));

        BookingResponse response = service.cancel(bookingId, "Unable to attend");

        assertNotNull(response);
        assertEquals("CANCELLED", booking.getStatus());
        assertEquals("REFUNDED", booking.getPaymentStatus());
        assertEquals(new BigDecimal("500.00"), payment.getRefundedTotal());
        assertEquals("REFUNDED", payment.getStatus());
        verify(refundRepository).save(any(Refund.class));
        verify(paymentRepository).save(payment);
    }
}
