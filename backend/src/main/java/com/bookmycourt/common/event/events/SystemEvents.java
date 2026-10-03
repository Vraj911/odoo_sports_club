package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.util.UUID;

public final class SystemEvents {

    private SystemEvents() {
    }

    public record ReportReady(UUID eventId, Instant occurredAt, UUID reportId, String reportType) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "REPORT:" + reportId;
        }
    }

    public record ShareLinkCreated(UUID eventId, Instant occurredAt, UUID linkId, String token, Instant expiresAt) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SHARE_LINK:" + linkId;
        }
    }

    public record SystemAlert(UUID eventId, Instant occurredAt, String severity, String message) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SYSTEM_ALERT:" + eventId;
        }
    }

    public record NotificationCreated(UUID eventId, Instant occurredAt, UUID notificationId, UUID userId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "NOTIFICATION:" + notificationId;
        }
    }

    public record ClubConfigChanged(UUID eventId, Instant occurredAt, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "CLUB_CONFIG";
        }
    }
}
