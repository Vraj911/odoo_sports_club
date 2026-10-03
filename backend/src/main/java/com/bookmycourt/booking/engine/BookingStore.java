package com.bookmycourt.booking.engine;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Minimal store contract used by the booking engine and unit tests. */
public interface BookingStore {

    long loadOccupiedMask(UUID courtId, LocalDate day);

    int countActiveForMemberDay(UUID memberId, LocalDate day);

    UUID insert(Model.BookingCommand cmd, Model.PriceQuote price, String status, OffsetDateTime holdUntil);

    Optional<Model.BookingRef> find(UUID bookingId);

    boolean cancel(UUID bookingId, String reason);

    boolean confirm(UUID bookingId, OffsetDateTime now);

    boolean expire(UUID bookingId, OffsetDateTime now);

    List<Model.BookingRef> findExpiredHolds(OffsetDateTime now);

    List<UUID> courtsOfSameSport(UUID courtId);
}
