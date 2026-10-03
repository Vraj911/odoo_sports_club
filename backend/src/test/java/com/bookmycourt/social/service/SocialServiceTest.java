package com.bookmycourt.social.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.booking.service.CalendarRegistry;
import com.bookmycourt.booking.service.OccupancyService;
import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.service.MembershipService;
import com.bookmycourt.social.dto.JoinSocialSessionRequest;
import com.bookmycourt.social.entity.SocialParticipant;
import com.bookmycourt.social.entity.SocialSession;
import com.bookmycourt.social.mapper.SocialMapper;
import com.bookmycourt.social.repository.SocialParticipantRepository;
import com.bookmycourt.social.repository.SocialSessionRepository;
import com.bookmycourt.social.repository.SocialTemplateRepository;
import com.bookmycourt.social.repository.WaitlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class SocialServiceTest {

    private SocialSessionRepository sessions;
    private SocialParticipantRepository participants;
    private WaitlistRepository waitlists;
    private SocialTemplateRepository templates;
    private CourtRepository courts;
    private MemberRepository members;
    private AppUserRepository users;
    private Guard guard;
    private CalendarRegistry calendarRegistry;
    private OccupancyService occupancyService;
    private MembershipService membershipService;
    private ClubSettingRepository clubSettingRepository;
    private DomainEventPublisher publisher;
    private BookingRepository bookings;
    private SocialService service;

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-10-05T08:00:00Z"),
            ClubTime.IST
    );

    @BeforeEach
    void setUp() {
        sessions = Mockito.mock(SocialSessionRepository.class);
        participants = Mockito.mock(SocialParticipantRepository.class);
        waitlists = Mockito.mock(WaitlistRepository.class);
        templates = Mockito.mock(SocialTemplateRepository.class);
        courts = Mockito.mock(CourtRepository.class);
        members = Mockito.mock(MemberRepository.class);
        users = Mockito.mock(AppUserRepository.class);
        guard = Mockito.mock(Guard.class);
        calendarRegistry = Mockito.mock(CalendarRegistry.class);
        occupancyService = Mockito.mock(OccupancyService.class);
        membershipService = Mockito.mock(MembershipService.class);
        clubSettingRepository = Mockito.mock(ClubSettingRepository.class);
        publisher = Mockito.mock(DomainEventPublisher.class);
        bookings = Mockito.mock(BookingRepository.class);
        SocialMapper mapper = new SocialMapper();

        when(guard.run(any(), any())).thenAnswer(invocation -> {
            Supplier<Guard.Decision<?>> supplier = invocation.getArgument(1);
            Guard.Decision<?> d = supplier.get();
            Object res = d.persist().get();
            d.apply().run();
            return res;
        });

        service = new SocialService(
                sessions, participants, waitlists, templates, courts,
                members, users, mapper, guard, calendarRegistry,
                occupancyService, membershipService, clubSettingRepository,
                publisher, FIXED_CLOCK, bookings
        );
    }

    @Test
    void joinSession_enforcesSharedDailyCapWithCourtBookings() {
        UUID sessionId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        SocialSession session = new SocialSession();
        session.setId(sessionId);
        session.setStartAt(Instant.parse("2026-10-05T10:00:00Z"));
        session.setEndAt(Instant.parse("2026-10-05T12:00:00Z"));
        session.setCapacity(10);
        session.setStatus("SCHEDULED");

        Member member = new Member();
        member.setId(memberId);

        when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
        when(members.findById(memberId)).thenReturn(Optional.of(member));
        when(participants.findBySession_IdAndMember_Id(sessionId, memberId)).thenReturn(Optional.empty());

        // Plan allows max 1 booking/session per day
        Plan plan = new Plan();
        plan.setMaxBookingsPerDay(1);
        when(membershipService.activePlan(eq(memberId), any())).thenReturn(Optional.of(plan));

        // Member already has 1 court booking on that day!
        when(bookings.countActiveForMemberDay(eq(memberId), any(), any())).thenReturn(1);
        when(participants.countJoinedForMemberDay(eq(memberId), any(), any())).thenReturn(0);

        JoinSocialSessionRequest request = new JoinSocialSessionRequest(memberId, null, null);

        assertThrows(DomainException.class, () -> service.joinSession(sessionId, request));
    }
}
