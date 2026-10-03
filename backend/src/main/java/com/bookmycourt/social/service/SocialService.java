package com.bookmycourt.social.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.social.dto.CreateSocialSessionRequest;
import com.bookmycourt.social.dto.CreateWaitlistRequest;
import com.bookmycourt.social.dto.JoinSocialSessionRequest;
import com.bookmycourt.social.dto.SocialParticipantResponse;
import com.bookmycourt.social.dto.SocialSessionResponse;
import com.bookmycourt.social.dto.WaitlistResponse;
import com.bookmycourt.social.entity.SocialParticipant;
import com.bookmycourt.social.entity.SocialSession;
import com.bookmycourt.social.entity.Waitlist;
import com.bookmycourt.social.mapper.SocialMapper;
import com.bookmycourt.social.repository.SocialParticipantRepository;
import com.bookmycourt.social.repository.SocialSessionRepository;
import com.bookmycourt.social.repository.WaitlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SocialService {

    private final SocialSessionRepository sessions;
    private final SocialParticipantRepository participants;
    private final WaitlistRepository waitlists;
    private final CourtRepository courts;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final SocialMapper mapper;

    public SocialService(
            SocialSessionRepository sessions,
            SocialParticipantRepository participants,
            WaitlistRepository waitlists,
            CourtRepository courts,
            MemberRepository members,
            AppUserRepository users,
            SocialMapper mapper) {
        this.sessions = sessions;
        this.participants = participants;
        this.waitlists = waitlists;
        this.courts = courts;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional
    public SocialSessionResponse createSession(CreateSocialSessionRequest request) {
        Court court = courts.findById(request.courtId())
                .orElseThrow(() -> new NotFoundException("Court not found"));

        SocialSession session = new SocialSession();
        session.setCourt(court);
        session.setTitle(request.title());
        session.setStartAt(request.startAt());
        session.setEndAt(request.endAt());
        session.setCapacity(request.capacity());
        session.setNotes(request.notes());
        session.setStatus("OPEN");

        if (request.createdByUserId() != null) {
            AppUser u = users.findById(request.createdByUserId()).orElse(null);
            session.setCreatedBy(u);
        }

        sessions.save(session);
        return mapper.toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<SocialSessionResponse> listSessions(UUID courtId) {
        List<SocialSession> list = (courtId != null)
                ? sessions.findByCourt_IdOrderByStartAtAsc(courtId)
                : sessions.findByStartAtAfterOrderByStartAtAsc(Instant.now().minusSeconds(86400));
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SocialSessionResponse getSession(UUID id) {
        SocialSession session = sessions.findById(id)
                .orElseThrow(() -> new NotFoundException("Social session not found"));
        return mapper.toResponse(session);
    }

    @Transactional
    public SocialParticipantResponse joinSession(UUID sessionId, JoinSocialSessionRequest request) {
        SocialSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Social session not found"));

        long currentCount = participants.countBySession_IdAndStatus(sessionId, "REGISTERED");
        if (currentCount >= session.getCapacity()) {
            throw new IllegalStateException("Session is already full. Please join waitlist.");
        }

        Member member = null;
        if (request.memberId() != null) {
            member = members.findById(request.memberId())
                    .orElseThrow(() -> new NotFoundException("Member not found"));
            if (participants.findBySession_IdAndMember_Id(sessionId, member.getId()).isPresent()) {
                throw new IllegalStateException("Member is already registered in this session");
            }
        }

        SocialParticipant p = new SocialParticipant();
        p.setSession(session);
        p.setMember(member);
        p.setGuestName(request.guestName());
        p.setGuestPhone(request.guestPhone());
        p.setStatus("REGISTERED");
        participants.save(p);

        if (currentCount + 1 >= session.getCapacity()) {
            session.setStatus("FULL");
            sessions.save(session);
        }

        return mapper.toResponse(p);
    }

    @Transactional
    public void cancelParticipation(UUID participantId) {
        SocialParticipant p = participants.findById(participantId)
                .orElseThrow(() -> new NotFoundException("Participant record not found"));
        p.setStatus("CANCELLED");
        participants.save(p);

        SocialSession session = p.getSession();
        if ("FULL".equalsIgnoreCase(session.getStatus())) {
            session.setStatus("OPEN");
            sessions.save(session);
        }
    }

    @Transactional
    public WaitlistResponse addToWaitlist(CreateWaitlistRequest request) {
        Waitlist w = new Waitlist();
        if (request.sessionId() != null) {
            SocialSession session = sessions.findById(request.sessionId()).orElse(null);
            w.setSession(session);
            long count = waitlists.countBySession_IdAndStatus(request.sessionId(), "WAITING");
            w.setPosition((int) count + 1);
        }
        if (request.courtId() != null) {
            Court court = courts.findById(request.courtId()).orElse(null);
            w.setCourt(court);
        }
        if (request.memberId() != null) {
            Member member = members.findById(request.memberId()).orElse(null);
            w.setMember(member);
        }
        w.setGuestName(request.guestName());
        w.setRequestedStartAt(request.requestedStartAt());
        w.setRequestedEndAt(request.requestedEndAt());
        w.setStatus("WAITING");

        waitlists.save(w);
        return mapper.toResponse(w);
    }

    @Transactional(readOnly = true)
    public List<WaitlistResponse> listWaitlist(UUID sessionId, UUID courtId) {
        if (sessionId != null) {
            return waitlists.findBySession_IdAndStatusOrderByPositionAsc(sessionId, "WAITING")
                    .stream().map(mapper::toResponse).toList();
        }
        if (courtId != null) {
            return waitlists.findByCourt_IdAndStatusOrderByPositionAsc(courtId, "WAITING")
                    .stream().map(mapper::toResponse).toList();
        }
        return waitlists.findAll().stream().map(mapper::toResponse).toList();
    }
}
