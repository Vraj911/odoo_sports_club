package com.bookmycourt.common.event;

import java.time.Instant;
import java.util.UUID;

public interface DomainEvent {
    UUID eventId();

    Instant occurredAt();

    String aggregateKey();

    default String type() {
        return getClass().getSimpleName();
    }
}
