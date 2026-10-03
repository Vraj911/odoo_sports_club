package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class HrEvents {

    private HrEvents() {
    }

    public record ShiftPublished(UUID eventId, Instant occurredAt, UUID shiftId, UUID employeeId, LocalDate shiftDate) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "EMPLOYEE:" + employeeId;
        }
    }

    public record LeaveRequested(UUID eventId, Instant occurredAt, UUID requestId, UUID employeeId, LocalDate fromDate, LocalDate toDate) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "EMPLOYEE:" + employeeId;
        }
    }

    public record LeaveDecided(UUID eventId, Instant occurredAt, UUID requestId, UUID employeeId, String status) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "EMPLOYEE:" + employeeId;
        }
    }

    public record PayrollFinalised(UUID eventId, Instant occurredAt, UUID runId, String month) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "PAYROLL_RUN:" + runId;
        }
    }

    public record PayslipReady(UUID eventId, Instant occurredAt, UUID payslipId, UUID employeeId, String month) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "PAYSLIP:" + payslipId;
        }
    }
}
