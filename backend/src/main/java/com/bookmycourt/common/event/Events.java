package com.bookmycourt.common.event;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

public final class Events {

    private Events() {
    }

    public static UUID nextId() {
        return UUID.randomUUID();
    }

    public static Instant now(Clock clock) {
        return clock != null ? clock.instant() : Instant.now();
    }
}
