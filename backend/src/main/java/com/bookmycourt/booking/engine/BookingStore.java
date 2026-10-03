package com.bookmycourt.booking.engine;

<<<<<<< HEAD
=======
import com.bookmycourt.booking.engine.Model.BookingCommand;
import com.bookmycourt.booking.engine.Model.BookingRef;
import com.bookmycourt.booking.engine.Model.PriceQuote;

>>>>>>> e7b54daf87d063ac1ecc499d35619ddc17732eb7
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

<<<<<<< HEAD
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

=======
public interface BookingStore {
    long loadOccupiedMask(UUID courtId, LocalDate day);
    int countActiveForMemberDay(UUID memberId, LocalDate day);
    UUID insert(BookingCommand command, PriceQuote price, String status, OffsetDateTime holdUntil);
    Optional<BookingRef> find(UUID bookingId);
    boolean cancel(UUID bookingId, String reason);
    boolean confirm(UUID bookingId, OffsetDateTime now);
    boolean expire(UUID bookingId, OffsetDateTime now);
    List<BookingRef> findExpiredHolds(OffsetDateTime now);
>>>>>>> e7b54daf87d063ac1ecc499d35619ddc17732eb7
    List<UUID> courtsOfSameSport(UUID courtId);
}
