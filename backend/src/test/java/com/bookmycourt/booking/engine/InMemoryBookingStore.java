package com.bookmycourt.booking.engine;

import com.bookmycourt.booking.engine.Model.BookingCommand;
import com.bookmycourt.booking.engine.Model.BookingRef;
import com.bookmycourt.booking.engine.Model.PriceQuote;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/** In-memory store for engine unit tests. Each write is immediately visible (no extra transaction). */
final class InMemoryBookingStore implements BookingStore {

    private final Map<UUID, BookingRef> byId = new ConcurrentHashMap<>();
    private final Map<UUID, Occupied> occupying = new ConcurrentHashMap<>();
    private final Map<UUID, String> sports = new ConcurrentHashMap<>();
    private final Map<UUID, OffsetDateTime> holds = new ConcurrentHashMap<>();
    private final Map<UUID, UUID> memberOf = new ConcurrentHashMap<>();
    private final AtomicLong seq = new AtomicLong();

    record Occupied(UUID courtId, LocalDate day, int startSlot, String status) {}

    void addCourt(UUID id, String sport) {
        sports.put(id, sport);
    }

    @Override
    public long loadOccupiedMask(UUID courtId, LocalDate day) {
        long mask = 0L;
        for (Occupied occ : occupying.values()) {
            if (occ.courtId.equals(courtId) && occ.day.equals(day) && isOccupying(occ.status)) {
                mask |= SlotMask.session(occ.startSlot);
            }
        }
        return mask;
    }

    @Override
    public int countActiveForMemberDay(UUID memberId, LocalDate day) {
        int n = 0;
        for (UUID id : byId.keySet()) {
            if (!memberId.equals(memberOf.get(id))) {
                continue;
            }
            Occupied occ = occupying.get(id);
            if (occ != null && occ.day.equals(day) && isOccupying(occ.status)) {
                n++;
            }
        }
        return n;
    }

    @Override
    public UUID insert(BookingCommand cmd, PriceQuote price, String status, OffsetDateTime holdUntil) {
        UUID id = new UUID(0L, seq.incrementAndGet());
        var local = cmd.start().atZoneSameInstant(BookingEngine.IST);
        int startSlot = local.getHour() * 2 + local.getMinute() / 30;
        LocalDate day = local.toLocalDate();
        byId.put(id, new BookingRef(id, cmd.courtId(), day, startSlot, status));
        occupying.put(id, new Occupied(cmd.courtId(), day, startSlot, status));
        if (cmd.memberId() != null) {
            memberOf.put(id, cmd.memberId());
        }
        if (holdUntil != null) {
            holds.put(id, holdUntil);
        }
        return id;
    }

    @Override
    public Optional<BookingRef> find(UUID bookingId) {
        return Optional.ofNullable(byId.get(bookingId));
    }

    @Override
    public boolean cancel(UUID bookingId, String reason) {
        Occupied occ = occupying.get(bookingId);
        if (occ == null || "CANCELLED".equals(occ.status) || "EXPIRED".equals(occ.status)) {
            return false;
        }
        occupying.put(bookingId, new Occupied(occ.courtId, occ.day, occ.startSlot, "CANCELLED"));
        byId.computeIfPresent(bookingId, (k, v) -> new BookingRef(v.id(), v.courtId(), v.day(), v.startSlot(), "CANCELLED"));
        holds.remove(bookingId);
        return true;
    }

    @Override
    public boolean confirm(UUID bookingId, OffsetDateTime now) {
        Occupied occ = occupying.get(bookingId);
        OffsetDateTime until = holds.get(bookingId);
        if (occ == null || !"PENDING".equals(occ.status)) {
            return false;
        }
        if (until != null && !until.isAfter(now)) {
            return false;
        }
        occupying.put(bookingId, new Occupied(occ.courtId, occ.day, occ.startSlot, "CONFIRMED"));
        byId.computeIfPresent(bookingId, (k, v) -> new BookingRef(v.id(), v.courtId(), v.day(), v.startSlot(), "CONFIRMED"));
        holds.remove(bookingId);
        return true;
    }

    @Override
    public boolean expire(UUID bookingId, OffsetDateTime now) {
        Occupied occ = occupying.get(bookingId);
        OffsetDateTime until = holds.get(bookingId);
        if (occ == null || !"PENDING".equals(occ.status) || until == null || until.isAfter(now)) {
            return false;
        }
        occupying.put(bookingId, new Occupied(occ.courtId, occ.day, occ.startSlot, "EXPIRED"));
        byId.computeIfPresent(bookingId, (k, v) -> new BookingRef(v.id(), v.courtId(), v.day(), v.startSlot(), "EXPIRED"));
        holds.remove(bookingId);
        return true;
    }

    @Override
    public List<BookingRef> findExpiredHolds(OffsetDateTime now) {
        List<BookingRef> out = new ArrayList<>();
        for (var e : holds.entrySet()) {
            if (!e.getValue().isAfter(now)) {
                BookingRef ref = byId.get(e.getKey());
                Occupied occ = occupying.get(e.getKey());
                if (ref != null && occ != null && "PENDING".equals(occ.status)) {
                    out.add(ref);
                }
            }
        }
        return out;
    }

    @Override
    public List<UUID> courtsOfSameSport(UUID courtId) {
        String sport = sports.get(courtId);
        return sports.entrySet().stream()
                .filter(e -> e.getValue().equals(sport))
                .map(Map.Entry::getKey)
                .toList();
    }

    private static boolean isOccupying(String status) {
        return "PENDING".equals(status) || "CONFIRMED".equals(status)
                || "CHECKED_IN".equals(status) || "COMPLETED".equals(status);
    }
}
