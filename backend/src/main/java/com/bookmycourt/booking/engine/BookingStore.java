package com.bookmycourt.booking.engine;

import com.bookmycourt.booking.engine.Model.BookingCommand;
import com.bookmycourt.booking.engine.Model.BookingRef;
import com.bookmycourt.booking.engine.Model.PriceQuote;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence port. The database is the SOURCE OF TRUTH; the engine's bitmasks are a fast index
 * rebuilt from it. Every WRITE method must COMMIT before it returns: the engine calls them
 * while holding the court/member lock, so no other thread can act on stale data.
 */
public interface BookingStore {

    long loadOccupiedMask(UUID courtId, LocalDate day);

    int countActiveForMemberDay(UUID memberId, LocalDate day);

    UUID insert(BookingCommand cmd, PriceQuote price, String status, OffsetDateTime holdUntil);

    Optional<BookingRef> find(UUID bookingId);

    boolean cancel(UUID bookingId, String reason);

    boolean confirm(UUID bookingId, OffsetDateTime now);

    boolean expire(UUID bookingId, OffsetDateTime now);

    List<BookingRef> findExpiredHolds(OffsetDateTime now);

    List<UUID> courtsOfSameSport(UUID courtId);
}
