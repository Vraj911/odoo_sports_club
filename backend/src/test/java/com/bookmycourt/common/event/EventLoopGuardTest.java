package com.bookmycourt.common.event;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EventLoopGuardTest {

    record DummyEvent(String type, String aggregateKey) implements DomainEvent {
        @Override
        public UUID eventId() {
            return UUID.randomUUID();
        }

        @Override
        public Instant occurredAt() {
            return Instant.now();
        }
    }

    @Test
    void testNormalEnterAndExit() {
        EventLoopGuard guard = new EventLoopGuard();
        DummyEvent e1 = new DummyEvent("BOOKING", "B1");

        assertTrue(guard.enter(e1));
        guard.exit();
        // Can enter again after exit
        assertTrue(guard.enter(e1));
        guard.exit();
    }

    @Test
    void testCycleDetection() {
        EventLoopGuard guard = new EventLoopGuard();
        DummyEvent e1 = new DummyEvent("BOOKING", "B1");

        assertTrue(guard.enter(e1));
        // Same event type and aggregate key while still on stack must be rejected
        assertFalse(guard.enter(e1));

        guard.exit();
    }

    @Test
    void testMaxDepthProtection() {
        EventLoopGuard guard = new EventLoopGuard();
        for (int i = 1; i <= 6; i++) {
            assertTrue(guard.enter(new DummyEvent("TYPE_" + i, "KEY_" + i)));
        }

        // 7th depth must be rejected
        assertFalse(guard.enter(new DummyEvent("TYPE_7", "KEY_7")));

        for (int i = 6; i >= 1; i--) {
            guard.exit();
        }
    }
}
