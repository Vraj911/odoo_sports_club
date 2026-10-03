package com.bookmycourt.booking.engine;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** Plain value types, lock keys and exceptions. No framework code in the core engine. */
public final class Model {
    private Model() {}

    public enum Channel { ONLINE, DESK }

    public record BookingCommand(UUID courtId, UUID memberId, String guestName, String guestPhone,
                                 OffsetDateTime start, Channel channel) {
        public boolean isMember() { return memberId != null; }
    }

    /** Price plus a human-readable explanation, produced by the pricing engine. */
    public record PriceQuote(BigDecimal amount, String breakdown) {}

    public record BookingResult(UUID bookingId, String status, BigDecimal price, OffsetDateTime holdExpiresAt) {}

    /** A session start: slot 0 = 00:00, slot 1 = 00:30 ... slot 47 = 23:30 (club local time). */
    public record Slot(UUID courtId, int startSlot) {
        public LocalTime time() { return LocalTime.of(startSlot / 2, (startSlot % 2) * 30); }
    }

    /** What the store knows about an existing booking (enough to free its slots). */
    public record BookingRef(UUID id, UUID courtId, LocalDate day, int startSlot, String status) {}

    /** openSlot/closeSlot are half-hour indexes, e.g. 12 = 06:00, 44 = 22:00. */
    public record ClubConfig(int openSlot, int closeSlot, int dailyCap, int holdMinutes) {}

    public record CourtDay(UUID courtId, LocalDate day) {}
    public record MemberDay(UUID memberId, LocalDate day) {}

    public static class SlotTakenException extends RuntimeException {
        private final List<Slot> alternatives;
        private final LocalDate day;
        public SlotTakenException(List<Slot> alternatives, LocalDate day) {
            super("Slot already taken");
            this.alternatives = alternatives;
            this.day = day;
        }
        public List<Slot> getAlternatives() { return alternatives; }
        public LocalDate getDay() { return day; }
    }

    public static class CapExceededException extends RuntimeException {
        public CapExceededException() { super("Daily booking limit reached"); }
    }

    public static class ConfirmationFailedException extends RuntimeException {
        public ConfirmationFailedException() { super("Booking hold is no longer confirmable"); }
    }

    public static class InvalidSlotException extends RuntimeException {
        public InvalidSlotException(String m) { super(m); }
    }
}
