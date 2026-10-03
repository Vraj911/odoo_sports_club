package com.bookmycourt.social.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.service.CalendarRegistry;
import com.bookmycourt.booking.service.OccupancyService;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.events.SocialEvents;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.service.MembershipService;
import com.bookmycourt.social.dto.CreateSocialSessionRequest;
import com.bookmycourt.social.dto.CreateWaitlistRequest;
import com.bookmycourt.social.dto.JoinSocialSessionRequest;
import com.bookmycourt.social.dto.SocialParticipantResponse;
import com.bookmycourt.social.dto.SocialSessionResponse;
import com.bookmycourt.social.dto.WaitlistResponse;
import com.bookmycourt.social.entity.SocialParticipant;
import com.bookmycourt.social.entity.SocialSession;
import com.bookmycourt.social.entity.SocialTemplate;
import com.bookmycourt.social.entity.Waitlist;
import com.bookmycourt.social.mapper.SocialMapper;
import com.bookmycourt.social.repository.SocialParticipantRepository;
import com.bookmycourt.social.repository.SocialSessionRepository;
import com.bookmycourt.social.repository.SocialTemplateRepository;
import com.bookmycourt.social.repository.WaitlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SocialService {

    private final SocialSessionRepository sessions;
    private final SocialParticipantRepository participants;
    private final WaitlistRepository waitlists;
    private final SocialTemplateRepository templates;
    private final CourtRepository courts;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final SocialMapper mapper;
    private final Guard guard;
    private final CalendarRegistry calendarRegistry;
    private final OccupancyService occupancyService;
    private final MembershipService membershipService;
    private final ClubSettingRepository clubSettingRepository;
    private final DomainEventPublisher publisher;
    private final Clock clock;

    public SocialService(
            SocialSessionRepository sessions,
            SocialParticipantRepository participants,
            WaitlistRepository waitlists,
            SocialTemplateRepository templates,
            CourtRepository courts,
            MemberRepository members,
            AppUserRepository users,
            SocialMapper mapper,
            Guard guard,
            CalendarRegistry calendarRegistry,
            OccupancyService occupancyService,
            MembershipService membershipService,
            ClubSettingRepository clubSettingRepository,
            DomainEventPublisher publisher,
            Clock clock
    ) {
        this.sessions = sessions;
        this.participants = participants;
        this.waitlists = waitlists;
        this.templates = templates;
        this.courts = courts;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
        this.guard = guard;
        this.calendarRegistry = calendarRegistry;
        this.occupancyService = occupancyService;
        this.membershipService = membershipService;
        this.clubSettingRepository = clubSettingRepository;
        this.publisher = publisher;
        this.clock = clock;
    }

    public SocialSessionResponse createSession(CreateSocialSessionRequest request) {
        Court court = courts.findById(request.courtId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found"));

        ZonedDateTime localStart = request.startAt().atZone(ClubTime.IST);
        ZonedDateTime localEnd = request.endAt().atZone(ClubTime.IST);
        LocalDate day = localStart.toLocalDate();

        int startSlot = localStart.getHour() * 2 + localStart.getMinute() / 30;
        int endSlot = localEnd.getHour() * 2 + localEnd.getMinute() / 30;
        if (endSlot <= startSlot) {
            endSlot = startSlot + 2;
        }
        long mask = SlotMask.range(startSlot, endSlot);

        Keys.CourtDay courtKey = new Keys.CourtDay(request.courtId(), day);

        SocialSession session = guard.run(List.of(courtKey), () -> {
            CourtDayCalendar cal = calendarRegistry.get(request.courtId(), day);
            if (!cal.isFree(mask)) {
                throw new DomainException(ErrorCode.SLOT_TAKEN, "Court is occupied during this time window");
            }

            return new Guard.Decision<>(
                    () -> {
                        SocialSession s = new SocialSession();
                        s.setCourt(court);
                        s.setTitle(request.title());
                        s.setStartAt(request.startAt());
                        s.setEndAt(request.endAt());
                        s.setCapacity(request.capacity() != null ? request.capacity() : 8);
                        s.setStatus("OPEN");
                        s.setNotes(request.notes());
                        if (request.createdByUserId() != null) {
                            users.findById(request.createdByUserId()).ifPresent(s::setCreatedBy);
                        }
                        sessions.save(s);

                        OffsetDateTime oStart = localStart.toOffsetDateTime();
                        OffsetDateTime oEnd = localEnd.toOffsetDateTime();
                        occupancyService.recordSocialSession(court.getId(), s.getId(), oStart, oEnd, ActorHolder.current().userId());
                        return s;
                    },
                    () -> {
                        cal.occupySocial(mask);
                        publisher.publish(new SocialEvents.SocialSessionCreated(UUID.randomUUID(), clock.instant(), court.getId()));
                    }
            );
        });

        return mapper.toResponse(session);
    }

    public SocialParticipantResponse joinSession(UUID sessionId, JoinSocialSessionRequest request) {
        SocialSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Social session not found"));

        if (!"OPEN".equalsIgnoreCase(session.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Social session is not open for joining");
        }

        LocalDate day = session.getStartAt().atZone(ClubTime.IST).toLocalDate();
        List<Object> keys = new ArrayList<>();
        keys.add(new Keys.SessionKey(sessionId));
        if (request.memberId() != null) {
            keys.add(new Keys.MemberDay(request.memberId(), day));
        }

        SocialParticipant participant = guard.run(keys, () -> {
            if (request.memberId() != null) {
                boolean alreadyJoined = participants.findBySession_IdAndMember_Id(sessionId, request.memberId()).isPresent();
                if (alreadyJoined) {
                    throw new DomainException(ErrorCode.DUPLICATE, "Member already registered for this session");
                }

                // Daily cap check
                int cap = getMemberCap(request.memberId(), day);
                Instant dayStart = day.atStartOfDay(ClubTime.IST).toInstant();
                Instant dayEnd = day.plusDays(1).atStartOfDay(ClubTime.IST).toInstant();
                int joinedSocials = participants.countJoinedForMemberDay(request.memberId(), dayStart, dayEnd);
                if (joinedSocials >= cap) {
                    throw new DomainException(ErrorCode.CAP_EXCEEDED, "Member daily booking cap exceeded");
                }
            }

            long currentCount = participants.countBySession_IdAndStatus(sessionId, "REGISTERED");
            boolean hasSpace = currentCount < session.getCapacity();
            String status = hasSpace ? "REGISTERED" : "WAITLIST";

            return new Guard.Decision<>(
                    () -> {
                        SocialParticipant p = new SocialParticipant();
                        p.setSession(session);
                        if (request.memberId() != null) {
                            members.findById(request.memberId()).ifPresent(p::setMember);
                        }
                        p.setGuestName(request.guestName());
                        p.setGuestPhone(request.guestPhone());
                        p.setStatus(status);
                        p.setJoinedAt(Instant.now(clock));
                        participants.save(p);
                        return p;
                    },
                    () -> {
                        Instant now = clock.instant();
                        if ("REGISTERED".equals(status)) {
                            publisher.publish(new SocialEvents.SocialParticipantJoined(UUID.randomUUID(), now, sessionId, request.memberId()));
                        } else {
                            publisher.publish(new SocialEvents.SocialParticipantWaitlisted(UUID.randomUUID(), now, sessionId, request.memberId()));
                        }
                    }
            );
        });

        return mapper.toParticipantResponse(participant);
    }

    public void leaveSession(UUID sessionId, UUID memberId) {
        SocialSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Social session not found"));

        SocialParticipant p = participants.findBySession_IdAndMember_Id(sessionId, memberId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Participant record not found"));

        Keys.SessionKey sessionKey = new Keys.SessionKey(sessionId);

        guard.run(List.of(sessionKey), () -> new Guard.Decision<>(
                () -> {
                    p.setStatus("CANCELLED");
                    participants.save(p);
                    return true;
                },
                () -> publisher.publish(new SocialEvents.SocialParticipantLeft(UUID.randomUUID(), clock.instant(), sessionId, memberId))
        ));

        // Promotion pipeline: try to promote first waitlisted member
        promoteNextWaitlisted(session);
    }

    public void deleteSession(UUID sessionId) {
        SocialSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Social session not found"));

        ZonedDateTime localStart = session.getStartAt().atZone(ClubTime.IST);
        ZonedDateTime localEnd = session.getEndAt().atZone(ClubTime.IST);
        LocalDate day = localStart.toLocalDate();

        int startSlot = localStart.getHour() * 2 + localStart.getMinute() / 30;
        int endSlot = localEnd.getHour() * 2 + localEnd.getMinute() / 30;
        if (endSlot <= startSlot) {
            endSlot = startSlot + 2;
        }
        long mask = SlotMask.range(startSlot, endSlot);

        Keys.CourtDay courtKey = new Keys.CourtDay(session.getCourt().getId(), day);

        guard.run(List.of(courtKey), () -> new Guard.Decision<>(
                () -> {
                    session.setStatus("CANCELLED");
                    sessions.save(session);
                    occupancyService.releaseSocialSession(sessionId);
                    return true;
                },
                () -> {
                    CourtDayCalendar cal = calendarRegistry.get(session.getCourt().getId(), day);
                    cal.releaseSocial(mask);
                    publisher.publish(new SocialEvents.SocialSessionDeleted(UUID.randomUUID(), clock.instant(), sessionId));
                }
        ));
    }

    public void expandTemplatesForNext4Weeks() {
        List<SocialTemplate> activeTemplates = templates.findByActiveTrue();
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));

        for (SocialTemplate tmpl : activeTemplates) {
            for (int week = 0; week < 4; week++) {
                LocalDate targetDate = today.plusWeeks(week);
                while (targetDate.getDayOfWeek().getValue() != tmpl.getWeekday()) {
                    targetDate = targetDate.plusDays(1);
                }

                ZonedDateTime sStart = targetDate.atTime(tmpl.getStartTime()).atZone(ClubTime.IST);
                ZonedDateTime sEnd = targetDate.atTime(tmpl.getEndTime()).atZone(ClubTime.IST);

                boolean exists = sessions.findByCourt_IdOrderByStartAtAsc(tmpl.getCourt().getId()).stream()
                        .anyMatch(s -> s.getStartAt().equals(sStart.toInstant()));

                if (!exists) {
                    try {
                        createSession(new CreateSocialSessionRequest(
                                tmpl.getCourt().getId(),
                                "Social Session: " + tmpl.getCourt().getName(),
                                sStart.toInstant(),
                                sEnd.toInstant(),
                                tmpl.getCapacity(),
                                "Recurring template session",
                                null
                        ));
                    } catch (Exception ex) {
                        // Conflict logged; continues with next week
                    }
                }
            }
        }
    }

    private void promoteNextWaitlisted(SocialSession session) {
        List<SocialParticipant> waitlisted = participants.findBySession_Id(session.getId()).stream()
                .filter(part -> "WAITLIST".equals(part.getStatus()))
                .toList();

        if (waitlisted.isEmpty()) {
            return;
        }

        SocialParticipant nextCandidate = waitlisted.get(0);
        if (nextCandidate.getMember() == null) {
            nextCandidate.setStatus("REGISTERED");
            participants.save(nextCandidate);
            return;
        }

        LocalDate day = session.getStartAt().atZone(ClubTime.IST).toLocalDate();
        Keys.MemberDay memberKey = new Keys.MemberDay(nextCandidate.getMember().getId(), day);
        Keys.SessionKey sessionKey = new Keys.SessionKey(session.getId());

        try {
            guard.run(List.of(memberKey, sessionKey), () -> {
                int cap = getMemberCap(nextCandidate.getMember().getId(), day);
                Instant dayStart = day.atStartOfDay(ClubTime.IST).toInstant();
                Instant dayEnd = day.plusDays(1).atStartOfDay(ClubTime.IST).toInstant();
                int joinedSocials = participants.countJoinedForMemberDay(nextCandidate.getMember().getId(), dayStart, dayEnd);

                if (joinedSocials >= cap) {
                    return Guard.Decision.noop(false);
                }

                return new Guard.Decision<>(
                        () -> {
                            nextCandidate.setStatus("REGISTERED");
                            participants.save(nextCandidate);
                            return true;
                        },
                        () -> publisher.publish(new SocialEvents.SocialParticipantPromoted(
                                UUID.randomUUID(), clock.instant(), session.getId(), nextCandidate.getMember().getId()))
                );
            });
        } catch (Exception ignored) {}
    }

    private int getMemberCap(UUID memberId, LocalDate date) {
        Optional<Plan> plan = membershipService.activePlan(memberId, date);
        if (plan.isPresent() && plan.get().getMaxBookingsPerDay() > 0) {
            return plan.get().getMaxBookingsPerDay();
        }
        return clubSettingRepository.findByKey("booking.default_daily_cap")
                .map(s -> {
                    try { return Integer.parseInt(s.getValue()); } catch (Exception ex) { return 2; }
                }).orElse(2);
    }

    @Transactional(readOnly = true)
    public List<SocialSessionResponse> listSessions(UUID courtId) {
        List<SocialSession> list = (courtId != null)
                ? sessions.findByCourt_IdOrderByStartAtAsc(courtId)
                : sessions.findByOrderByStartAtDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SocialSessionResponse getSession(UUID id) {
        SocialSession session = sessions.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Social session not found"));
        return mapper.toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<SocialParticipantResponse> listParticipants(UUID sessionId) {
        return participants.findBySession_Id(sessionId).stream()
                .map(mapper::toParticipantResponse)
                .toList();
    }

    @Transactional
    public WaitlistResponse joinWaitlist(CreateWaitlistRequest request) {
        Waitlist w = new Waitlist();
        if (request.sessionId() != null) {
            sessions.findById(request.sessionId()).ifPresent(w::setSession);
        }
        if (request.courtId() != null) {
            courts.findById(request.courtId()).ifPresent(w::setCourt);
        }
        if (request.memberId() != null) {
            members.findById(request.memberId()).ifPresent(w::setMember);
        }
        w.setGuestName(request.guestName());
        w.setRequestedStartAt(request.requestedStartAt());
        w.setRequestedEndAt(request.requestedEndAt());
        w.setStatus("WAITING");

        long pos = (request.sessionId() != null)
                ? waitlists.countBySession_IdAndStatus(request.sessionId(), "WAITING") + 1
                : 1;
        w.setPosition((int) pos);

        waitlists.save(w);
        return mapper.toWaitlistResponse(w);
    }

    public WaitlistResponse addToWaitlist(CreateWaitlistRequest request) {
        return joinWaitlist(request);
    }

    @Transactional(readOnly = true)
    public List<WaitlistResponse> listWaitlist(UUID sessionId, UUID courtId) {
        List<Waitlist> list = (sessionId != null)
                ? waitlists.findBySession_IdAndStatusOrderByPositionAsc(sessionId, "WAITING")
                : (courtId != null)
                ? waitlists.findByCourt_IdAndStatusOrderByPositionAsc(courtId, "WAITING")
                : waitlists.findAll();
        return list.stream().map(mapper::toWaitlistResponse).toList();
    }

    public void cancelParticipation(UUID id) {
        SocialParticipant p = participants.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Participant not found"));
        leaveSession(p.getSession().getId(), p.getMember() != null ? p.getMember().getId() : null);
    }
}
