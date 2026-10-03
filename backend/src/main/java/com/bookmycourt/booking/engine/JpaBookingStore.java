package com.bookmycourt.booking.engine;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.MemberRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
@Repository
public class JpaBookingStore implements BookingStore {
    static final Set<String> OCCUPYING = Set.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED");
    static final Set<String> COUNTS_TO_CAP = Set.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED");
    private final BookingRepository bookings;
    private final CourtRepository courts;
    private final MemberRepository members;
    public JpaBookingStore(BookingRepository bookings, CourtRepository courts, MemberRepository members) {
        this.bookings = bookings;
        this.courts = courts;
        this.members = members;
    }
    @Override
    @Transactional(readOnly = true)
    public long loadOccupiedMask(UUID courtId, LocalDate day) {
        OffsetDateTime from = startOfDay(day);
        OffsetDateTime to = startOfDay(day.plusDays(1));
        long mask = 0L;
        for (Booking booking : bookings.findOccupying(courtId, from, to, OCCUPYING)) {
            mask |= SlotMask.session(toStartSlot(booking.getStartTime()));
        }
        return mask;
    }
    @Override
    @Transactional(readOnly = true)
    public int countActiveForMemberDay(UUID memberId, LocalDate day) {
        OffsetDateTime from = startOfDay(day);
        OffsetDateTime to = startOfDay(day.plusDays(1));
        return bookings.countActiveForMemberDay(memberId, from, to, COUNTS_TO_CAP);
    }
    @Override
    @Transactional
    public UUID insert(Model.BookingCommand cmd, Model.PriceQuote price, String status, OffsetDateTime holdUntil) {
        Court court = courts.findById(cmd.courtId())
                .orElseThrow(() -> new Model.InvalidSlotException("Unknown court"));
        Booking booking = new Booking();
        booking.setCourt(court);
        if (cmd.memberId() != null) {
            Member member = members.findById(cmd.memberId())
                    .orElseThrow(() -> new Model.InvalidSlotException("Unknown member"));
            booking.setMember(member);
        }
        booking.setGuestName(cmd.guestName());
        booking.setGuestPhone(cmd.guestPhone());
        booking.setStartTime(cmd.start());
        booking.setEndTime(cmd.start().plusMinutes(60));
        booking.setStatus(status);
        booking.setPriceCharged(price.amount());
        booking.setPaymentStatus("CONFIRMED".equals(status) && price.amount().signum() == 0 ? "PAID" : "UNPAID");
        booking.setExpiresAt(holdUntil);
        booking.setNotes(price.breakdown());
        bookings.saveAndFlush(booking);
        return booking.getId();
    }
    @Override
    @Transactional(readOnly = true)
    public Optional<Model.BookingRef> find(UUID bookingId) {
        return bookings.findById(bookingId).map(this::toRef);
    }
    @Override
    @Transactional
    public boolean cancel(UUID bookingId, String reason) {
        return bookings.markCancelled(bookingId, reason) > 0;
    }
    @Override
    @Transactional
    public boolean confirm(UUID bookingId, OffsetDateTime now) {
        return bookings.markConfirmed(bookingId, now) > 0;
    }
    @Override
    @Transactional
    public boolean expire(UUID bookingId, OffsetDateTime now) {
        return bookings.markExpired(bookingId, now) > 0;
    }
    @Override
    @Transactional(readOnly = true)
    public List<Model.BookingRef> findExpiredHolds(OffsetDateTime now) {
        return bookings.findByExpiresAtLessThanEqualAndStatus(now, "PENDING").stream()
                .map(this::toRef)
                .toList();
    }
    @Override
    @Transactional(readOnly = true)
    public List<UUID> courtsOfSameSport(UUID courtId) {
        Court court = courts.findById(courtId).orElseThrow();
        return courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(court.getSport()).stream()
                .map(Court::getId)
                .toList();
    }
    private Model.BookingRef toRef(Booking booking) {
        OffsetDateTime start = booking.getStartTime();
        return new Model.BookingRef(
                booking.getId(),
                booking.getCourt().getId(),
                start.atZoneSameInstant(BookingEngine.IST).toLocalDate(),
                toStartSlot(start),
                booking.getStatus()
        );
    }
    static int toStartSlot(OffsetDateTime start) {
        var local = start.atZoneSameInstant(BookingEngine.IST);
        return local.getHour() * 2 + local.getMinute() / 30;
    }
    static OffsetDateTime startOfDay(LocalDate day) {
        return ZonedDateTime.of(day.atStartOfDay(), BookingEngine.IST).toOffsetDateTime()
                .withOffsetSameInstant(ZoneOffset.UTC);
    }
}
