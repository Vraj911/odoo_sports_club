package com.bookmycourt.booking.engine;

/**
 * Minimal BookingEngine contract used by other modules. The real implementation
 * lives elsewhere; this interface provides the static IST ZoneId and the
 * config() accessor used across the application.
 */
package com.bookmycourt.booking.engine;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal BookingEngine implementation used by unit tests and as a placeholder
 * for the real engine. It provides thread-safe booking semantics sufficient for
 * the project's unit tests.
 */
public class BookingEngine {
    public static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final BookingStore store;
    private final Model.ClubConfig cfg;
    // per-court-day locks to serialize booking attempts for the same court/day
    private final Map<String, Object> locks = new ConcurrentHashMap<>();

    public BookingEngine(BookingStore store, Model.ClubConfig cfg) {
        this.store = store;
        this.cfg = cfg;
    }

    public Model.ClubConfig config() {
        return cfg;
    }

    /**
     * Attempt to book a slot. Throws SlotTakenException when the slot is already occupied.
     */
    public UUID book(Model.BookingCommand cmd, Model.PriceQuote price) {
        var zdt = cmd.start().atZoneSameInstant(IST);
        LocalDate day = zdt.toLocalDate();
        int startSlot = zdt.getHour() * 2 + zdt.getMinute() / 30;
        String lockKey = cmd.courtId().toString() + "-" + day.toString();
        Object lk = locks.computeIfAbsent(lockKey, k -> new Object());
        synchronized (lk) {
            long mask = store.loadOccupiedMask(cmd.courtId(), day);
            if ((mask & SlotMask.session(startSlot)) != 0) {
                // offer simple alternatives: neighbouring slots
                List<Model.Slot> alts = new ArrayList<>();
                if (startSlot > 0) alts.add(new Model.Slot(cmd.courtId(), startSlot - 1));
                if (startSlot + 1 < SlotMask.SLOTS_PER_DAY) alts.add(new Model.Slot(cmd.courtId(), startSlot + 1));
                throw new Model.SlotTakenException(alts, day);
            }
            return store.insert(cmd, price, "PENDING", null);
        }
    }

    public long occupancy(UUID courtId, LocalDate day) {
        return store.loadOccupiedMask(courtId, day);
    }

    public List<Integer> startableSlots(UUID courtId, LocalDate day) {
        long mask = store.loadOccupiedMask(courtId, day);
        List<Integer> out = new ArrayList<>();
        for (int s = 0; s < SlotMask.SLOTS_PER_DAY; s++) {
            boolean free = (mask & SlotMask.session(s)) == 0;
            // ensure the session (two bits) around start is free
            if (free) {
                out.add(s);
            }
        }
        return out;
    }
}
