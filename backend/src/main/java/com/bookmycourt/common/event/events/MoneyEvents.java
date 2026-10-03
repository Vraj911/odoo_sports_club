package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;
import com.bookmycourt.common.money.Money;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class MoneyEvents {

    private MoneyEvents() {
    }

    public record PaymentRecorded(UUID eventId, Instant occurredAt, UUID paymentId, String sourceType, UUID sourceId, UUID memberId, Money amount, String method, boolean simulated) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "PAYMENT:" + paymentId;
        }
    }

    public record PaymentVoided(UUID eventId, Instant occurredAt, UUID paymentId, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "PAYMENT:" + paymentId;
        }
    }

    public record RefundRecorded(UUID eventId, Instant occurredAt, UUID refundId, UUID paymentId, Money amount, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "REFUND:" + refundId;
        }
    }

    public record DueCreated(UUID eventId, Instant occurredAt, UUID dueId, UUID memberId, Money amount, String refType, UUID refId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "DUE:" + dueId;
        }
    }

    public record DueCollected(UUID eventId, Instant occurredAt, UUID dueId, UUID paymentId, Money amount) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "DUE:" + dueId;
        }
    }

    public record DueWrittenOff(UUID eventId, Instant occurredAt, UUID dueId, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "DUE:" + dueId;
        }
    }

    public record LedgerPosted(UUID eventId, Instant occurredAt, UUID transactionId, LocalDate bookedDate, String kind, String refType, UUID refId, Money totalAmount, String source, String method, boolean simulated) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "LEDGER:" + transactionId;
        }
    }

    public record InvoiceIssued(UUID eventId, Instant occurredAt, UUID invoiceId, UUID memberId, Money amount, String invoiceNumber) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "INVOICE:" + invoiceId;
        }
    }

    public record InvoiceOverdue(UUID eventId, Instant occurredAt, UUID invoiceId, LocalDate dueDate) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "INVOICE:" + invoiceId;
        }
    }

    public record CreditNoteIssued(UUID eventId, Instant occurredAt, UUID creditNoteId, UUID originalInvoiceId, Money amount) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "INVOICE:" + creditNoteId;
        }
    }

    public record ReconciliationVariance(UUID eventId, Instant occurredAt, LocalDate businessDate, String method, Money variance) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "RECONCILIATION:" + businessDate + ":" + method;
        }
    }
}
