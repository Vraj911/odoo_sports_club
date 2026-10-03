package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;
import com.bookmycourt.common.money.Money;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class BookingEvents {

    private BookingEvents() {
    }

    public record BookingCreated(UUID eventId, Instant occurredAt, UUID bookingId, UUID courtId, UUID memberId, OffsetDateTime startTime, OffsetDateTime endTime, Money price, String status) implements DomainEvent {
        public BookingCreated(UUID eventId, Instant occurredAt, UUID courtId, LocalDate day) {
            this(eventId, occurredAt, UUID.randomUUID(), courtId, null, null, null, null, null);
        }

        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingConfirmed(UUID eventId, Instant occurredAt, UUID bookingId, UUID courtId, UUID memberId) implements DomainEvent {
        public BookingConfirmed(UUID eventId, Instant occurredAt, UUID bookingId) {
            this(eventId, occurredAt, bookingId, null, null);
        }

        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingCancelled(UUID eventId, Instant occurredAt, UUID bookingId, UUID courtId, UUID memberId, Money refundAmount, String reason) implements DomainEvent {
        public BookingCancelled(UUID eventId, Instant occurredAt, UUID bookingId, BigDecimal refundAmount) {
            this(eventId, occurredAt, bookingId, null, null, refundAmount != null ? Money.ofRupees(refundAmount) : Money.ZERO, null);
        }

        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingRescheduled(UUID eventId, Instant occurredAt, UUID bookingId, UUID oldCourtId, UUID newCourtId, OffsetDateTime oldStart, OffsetDateTime newStart) implements DomainEvent {
        public BookingRescheduled(UUID eventId, Instant occurredAt, UUID bookingId) {
            this(eventId, occurredAt, bookingId, null, null, null, null);
        }

        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingCheckedIn(UUID eventId, Instant occurredAt, UUID bookingId, UUID memberId) implements DomainEvent {
        public BookingCheckedIn(UUID eventId, Instant occurredAt, UUID bookingId) {
            this(eventId, occurredAt, bookingId, null);
        }

        @Override
        public String aggregateKey() {
            return "BOOKING:" + bookingId;
        }
    }

    public record BookingNoShow(UUID eventId, Instant occurredAt, UUID bookingId, UUID memberId) implements DomainEvent {
        public BookingNoShow(UUID eventId, Instant occurredAt, UUID bookingId) {
            this(eventId, occurredAt, bookingId, null);
        }

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
        public CourtBlocked(UUID eventId, Instant occurredAt, UUID courtId) {
            this(eventId, occurredAt, UUID.randomUUID(), courtId, null, null, null);
        }

        @Override
        public String aggregateKey() {
            return "OCCUPANCY:" + occupancyId;
        }
    }
}
