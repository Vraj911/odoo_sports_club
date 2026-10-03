package com.bookmycourt.common.state;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StateMachineTest {

    enum TestStatus {
        DRAFT,
        PENDING,
        ACTIVE,
        CANCELLED
    }

    @Test
    void testAllowedTransitions() {
        StateMachine<TestStatus> sm = StateMachine.of(TestStatus.class)
                .allow(TestStatus.DRAFT, TestStatus.PENDING, TestStatus.CANCELLED)
                .allow(TestStatus.PENDING, TestStatus.ACTIVE, TestStatus.CANCELLED)
                .build();

        assertTrue(sm.canTransition(TestStatus.DRAFT, TestStatus.PENDING));
        assertTrue(sm.canTransition(TestStatus.PENDING, TestStatus.ACTIVE));
        assertFalse(sm.canTransition(TestStatus.DRAFT, TestStatus.ACTIVE));
        assertFalse(sm.canTransition(TestStatus.CANCELLED, TestStatus.ACTIVE));

        assertDoesNotThrow(() -> sm.check(TestStatus.DRAFT, TestStatus.PENDING, "TestEntity"));

        DomainException ex = assertThrows(DomainException.class, () ->
                sm.check(TestStatus.DRAFT, TestStatus.ACTIVE, "TestEntity")
        );
        assertEquals(ErrorCode.INVALID_STATE, ex.getErrorCode());
    }
}
