package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class MembershipEvents {

    private MembershipEvents() {
    }

    public record MemberRegistered(UUID eventId, Instant occurredAt, UUID memberId, String name, String phone, String email) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBER:" + memberId;
        }
    }

    public record MembershipPurchased(UUID eventId, Instant occurredAt, UUID membershipId, UUID memberId, UUID planId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBERSHIP:" + membershipId;
        }
    }

    public record MembershipActivated(UUID eventId, Instant occurredAt, UUID membershipId, UUID memberId, UUID planId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBERSHIP:" + membershipId;
        }
    }

    public record MembershipRenewed(UUID eventId, Instant occurredAt, UUID membershipId, UUID memberId, UUID planId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBERSHIP:" + membershipId;
        }
    }

    public record MembershipTierChanged(UUID eventId, Instant occurredAt, UUID memberId, String oldTier, String newTier, LocalDate effectiveDate) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBER:" + memberId;
        }
    }

    public record MembershipExpiring(UUID eventId, Instant occurredAt, UUID membershipId, UUID memberId, int daysLeft) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBERSHIP:" + membershipId;
        }
    }

    public record MembershipExpired(UUID eventId, Instant occurredAt, UUID membershipId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBERSHIP:" + membershipId;
        }
    }

    public record MembershipSuspended(UUID eventId, Instant occurredAt, UUID membershipId, UUID memberId, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBERSHIP:" + membershipId;
        }
    }

    public record JuniorTurning18(UUID eventId, Instant occurredAt, UUID memberId, LocalDate birthDate) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "MEMBER:" + memberId;
        }
    }
}
