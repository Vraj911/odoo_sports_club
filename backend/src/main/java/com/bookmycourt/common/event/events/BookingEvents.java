package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;
import com.bookmycourt.common.money.Money;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class BookingEvents {

    private BookingEvents() {
    }

    public record BookingCreated(UUID eventId, Instant occurredAt, UUID bookingId, UUID courtId, UUID memberId, OffsetDateTime startTime, OffsetDateTime endTime, Money price, String status) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingConfirmed(UUID eventId, Instant occurredAt, UUID bookingId, UUID courtId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingCancelled(UUID eventId, Instant occurredAt, UUID bookingId, UUID courtId, UUID memberId, Money refundAmount, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingRescheduled(UUID eventId, Instant occurredAt, UUID bookingId, UUID oldCourtId, UUID newCourtId, OffsetDateTime oldStart, OffsetDateTime newStart) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingCheckedIn(UUID eventId, Instant occurredAt, UUID bookingId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingNoShow(UUID eventId, Instant occurredAt, UUID bookingId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingRepriced(UUID eventId, Instant occurredAt, UUID bookingId, Money oldPrice, Money newPrice) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingReminderDue(UUID eventId, Instant occurredAt, UUID bookingId, UUID memberId, OffsetDateTime startTime) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingChanged(UUID eventId, Instant occurredAt, UUID courtId, LocalDate day) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "COURTDAY:" + courtId + ":" + day;
        }
    }

    public record SlotReleased(UUID eventId, Instant occurredAt, UUID courtId, LocalDate day, int startSlot) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "COURTDAY:" + courtId + ":" + day;
        }
    }

    public record WaitlistOffered(UUID eventId, Instant occurredAt, UUID waitlistId, UUID memberId, UUID bookingId, OffsetDateTime expiresAt) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "WAITLIST:" + waitlistId;
        }
    }

    public record CourtBlocked(UUID eventId, Instant occurredAt, UUID occupancyId, UUID courtId, OffsetDateTime from, OffsetDateTime to, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "OCCUPANCY:" + occupancyId;
        }
    }
}
