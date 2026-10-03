package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.util.UUID;

public final class CrmEvents {

    private CrmEvents() {
    }

    public record LeadCreated(UUID eventId, Instant occurredAt, UUID leadId, String name, String phone, String email, UUID assignedTo) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "LEAD:" + leadId;
        }
    }

    public record LeadStatusChanged(UUID eventId, Instant occurredAt, UUID leadId, String oldStatus, String newStatus) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "LEAD:" + leadId;
        }
    }

    public record FollowUpOverdue(UUID eventId, Instant occurredAt, UUID followUpId, UUID leadId, UUID assignedTo) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "FOLLOWUP:" + followUpId;
        }
    }

    public record QuoteSent(UUID eventId, Instant occurredAt, UUID quoteId, UUID leadId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "QUOTE:" + quoteId;
        }
    }

    public record LeadConverted(UUID eventId, Instant occurredAt, UUID leadId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "LEAD:" + leadId;
        }
    }
}
