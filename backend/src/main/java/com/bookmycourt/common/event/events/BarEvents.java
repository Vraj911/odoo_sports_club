package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class BarEvents {

    private BarEvents() {
    }

    public record BarOrderPlaced(UUID eventId, Instant occurredAt, UUID orderId, UUID tabId, UUID tableId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BAR_ORDER:" + orderId;
        }
    }

    public record KitchenTicketChanged(UUID eventId, Instant occurredAt, UUID lineId, String station, String status) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BAR_LINE:" + lineId;
        }
    }

    public record BarTabSettled(UUID eventId, Instant occurredAt, UUID tabId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BAR_TAB:" + tabId;
        }
    }

    public record BarTabMovedToAccount(UUID eventId, Instant occurredAt, UUID tabId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BAR_TAB:" + tabId;
        }
    }

    public record BarDayClosed(UUID eventId, Instant occurredAt, LocalDate businessDate, UUID closedBy) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BAR_DAY:" + businessDate;
        }
    }

    public record BarDayReopened(UUID eventId, Instant occurredAt, LocalDate businessDate, UUID reopenedBy, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "BAR_DAY:" + businessDate;
        }
    }

    public record CashShiftClosed(UUID eventId, Instant occurredAt, UUID shiftId, UUID staffUserId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "CASH_SHIFT:" + shiftId;
        }
    }
}
