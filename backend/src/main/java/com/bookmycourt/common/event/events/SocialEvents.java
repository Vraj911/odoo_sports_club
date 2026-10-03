package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.util.UUID;

public final class SocialEvents {

    private SocialEvents() {
    }

    public record SocialSessionCreated(UUID eventId, Instant occurredAt, UUID sessionId, UUID courtId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SOCIAL_SESSION:" + sessionId;
        }
    }

    public record SocialParticipantJoined(UUID eventId, Instant occurredAt, UUID participantId, UUID sessionId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SOCIAL_SESSION:" + sessionId;
        }
    }

    public record SocialParticipantWaitlisted(UUID eventId, Instant occurredAt, UUID participantId, UUID sessionId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SOCIAL_SESSION:" + sessionId;
        }
    }

    public record SocialParticipantPromoted(UUID eventId, Instant occurredAt, UUID participantId, UUID sessionId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SOCIAL_SESSION:" + sessionId;
        }
    }

    public record SocialParticipantLeft(UUID eventId, Instant occurredAt, UUID participantId, UUID sessionId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SOCIAL_SESSION:" + sessionId;
        }
    }

    public record SocialSessionDeleted(UUID eventId, Instant occurredAt, UUID sessionId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SOCIAL_SESSION:" + sessionId;
        }
    }
}
