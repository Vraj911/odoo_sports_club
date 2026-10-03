package com.bookmycourt.social.mapper;

import com.bookmycourt.social.dto.SocialParticipantResponse;
import com.bookmycourt.social.dto.SocialSessionResponse;
import com.bookmycourt.social.dto.WaitlistResponse;
import com.bookmycourt.social.entity.SocialParticipant;
import com.bookmycourt.social.entity.SocialSession;
import com.bookmycourt.social.entity.Waitlist;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class SocialMapper {

    public SocialParticipantResponse toResponse(SocialParticipant p) {
        String memberName = null;
        if (p.getMember() != null) {
            memberName = p.getMember().getFirstName() + " " + p.getMember().getLastName();
        }
        return new SocialParticipantResponse(
                p.getId(),
                p.getSession().getId(),
                p.getMember() == null ? null : p.getMember().getId(),
                memberName,
                p.getGuestName(),
                p.getStatus(),
                p.getJoinedAt()
        );
    }

    public SocialSessionResponse toResponse(SocialSession s) {
        List<SocialParticipantResponse> participants = s.getParticipants() == null
                ? Collections.emptyList()
                : s.getParticipants().stream().map(this::toResponse).toList();

        long regCount = participants.stream()
                .filter(p -> "REGISTERED".equalsIgnoreCase(p.status()) || "ATTENDED".equalsIgnoreCase(p.status()))
                .count();

        return new SocialSessionResponse(
                s.getId(),
                s.getCourt().getId(),
                s.getCourt().getName(),
                s.getCourt().getSport(),
                s.getTitle(),
                s.getStartAt(),
                s.getEndAt(),
                s.getCapacity(),
                (int) regCount,
                s.getStatus(),
                s.getNotes(),
                participants,
                s.getCreatedAt()
        );
    }

    public WaitlistResponse toResponse(Waitlist w) {
        String memberName = null;
        if (w.getMember() != null) {
            memberName = w.getMember().getFirstName() + " " + w.getMember().getLastName();
        }
        return new WaitlistResponse(
                w.getId(),
                w.getSession() == null ? null : w.getSession().getId(),
                w.getCourt() == null ? null : w.getCourt().getId(),
                w.getMember() == null ? null : w.getMember().getId(),
                memberName,
                w.getGuestName(),
                w.getRequestedStartAt(),
                w.getRequestedEndAt(),
                w.getPosition(),
                w.getStatus(),
                w.getCreatedAt()
        );
    }

    public SocialParticipantResponse toParticipantResponse(SocialParticipant p) {
        return toResponse(p);
    }

    public WaitlistResponse toWaitlistResponse(Waitlist w) {
        return toResponse(w);
    }
}
