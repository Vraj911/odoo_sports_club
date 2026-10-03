package com.bookmycourt.booking.engine;
import com.bookmycourt.booking.engine.Model.BookingCommand;
import com.bookmycourt.booking.engine.Model.BookingRef;
import com.bookmycourt.booking.engine.Model.BookingResult;
import com.bookmycourt.booking.engine.Model.CapExceededException;
import com.bookmycourt.booking.engine.Model.Channel;
import com.bookmycourt.booking.engine.Model.ClubConfig;
import com.bookmycourt.booking.engine.Model.CourtDay;
import com.bookmycourt.booking.engine.Model.InvalidSlotException;
import com.bookmycourt.booking.engine.Model.MemberDay;
import com.bookmycourt.booking.engine.Model.PriceQuote;
import com.bookmycourt.booking.engine.Model.Slot;
import com.bookmycourt.booking.engine.Model.SlotTakenException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
public final class BookingEngine {
    public static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private final BookingStore store;
    private final ClubConfig cfg;
    private final boolean locking;
    private final LockTable locks = new LockTable(1024);
    private final ConcurrentHashMap<CourtDay, CourtDayCalendar> calendars = new ConcurrentHashMap<>();
    public BookingEngine(BookingStore store, ClubConfig cfg) {
        this(store, cfg, true);
    }
    BookingEngine(BookingStore store, ClubConfig cfg, boolean locking) {
        this.store = store;
        this.cfg = cfg;
        this.locking = locking;
    }
    public BookingResult book(BookingCommand cmd, PriceQuote price) {
        ZonedDateTime local = cmd.start().atZoneSameInstant(IST);
        if (local.getMinute() % 30 != 0 || local.getSecond() != 0 || local.getNano() != 0) {
            throw new InvalidSlotException("Bookings must start on a :00 or :30 boundary");
        }
        if (cmd.start().isBefore(OffsetDateTime.now())) {
            throw new InvalidSlotException("Cannot book a slot in the past");
        }
        LocalDate day = local.toLocalDate();
        int startSlot = local.getHour() * 2 + local.getMinute() / 30;
        if (startSlot < cfg.openSlot() || startSlot > cfg.closeSlot() - 2) {
            throw new InvalidSlotException("Outside opening hours");
        }
        long mask = SlotMask.session(startSlot);
        CourtDay courtKey = new CourtDay(cmd.courtId(), day);
        MemberDay memberKey = cmd.isMember() ? new MemberDay(cmd.memberId(), day) : null;
        try (var ignored = lock(memberKey, courtKey)) {
            CourtDayCalendar cal = calendar(courtKey);
            if (memberKey != null && store.countActiveForMemberDay(cmd.memberId(), day) >= cfg.dailyCap()) {
                throw new CapExceededException();
            }
            if (!cal.isFree(mask)) {
                releaseExpiredHolds(courtKey, cal);
                if (!cal.isFree(mask)) {
                    throw new SlotTakenException(suggest(cmd, day, startSlot), day);
                }
            }
            boolean confirmNow = price.amount().signum() == 0 || cmd.channel() == Channel.DESK;
            OffsetDateTime holdUntil = confirmNow ? null : OffsetDateTime.now().plusMinutes(cfg.holdMinutes());
            String status = confirmNow ? "CONFIRMED" : "PENDING";
            UUID id = store.insert(cmd, price, status, holdUntil);
            cal.occupy(mask);
            return new BookingResult(id, status, price.amount(), holdUntil);
        }
    }
    public void cancel(UUID bookingId, String reason) {
        BookingRef ref = store.find(bookingId).orElseThrow();
        CourtDay courtKey = new CourtDay(ref.courtId(), ref.day());
        try (var ignored = lock(null, courtKey)) {
            if (store.cancel(bookingId, reason)) {
                calendar(courtKey).release(SlotMask.session(ref.startSlot()));
            }
        }
    }
    public boolean confirm(UUID bookingId) {
        return store.confirm(bookingId, OffsetDateTime.now());
    }
    public int reapExpiredHolds() {
        int released = 0;
        for (BookingRef ref : store.findExpiredHolds(OffsetDateTime.now())) {
            CourtDay courtKey = new CourtDay(ref.courtId(), ref.day());
            try (var ignored = lock(null, courtKey)) {
                if (store.expire(ref.id(), OffsetDateTime.now())) {
                    calendar(courtKey).release(SlotMask.session(ref.startSlot()));
                    released++;
                }
            }
        }
        return released;
    }
    public long occupancy(UUID courtId, LocalDate day) {
        return calendar(new CourtDay(courtId, day)).occupiedMask();
    }
    public List<Integer> startableSlots(UUID courtId, LocalDate day) {
        long bits = calendar(new CourtDay(courtId, day))
                .startable(SlotMask.openStarts(cfg.openSlot(), cfg.closeSlot()));
        List<Integer> out = new ArrayList<>();
        boolean today = day.equals(LocalDate.now(IST));
        int nowSlot = ZonedDateTime.now(IST).getHour() * 2 + ZonedDateTime.now(IST).getMinute() / 30;
        while (bits != 0) {
            int slot = Long.numberOfTrailingZeros(bits);
            if (!today || slot > nowSlot) {
                out.add(slot);
            }
            bits &= bits - 1;
        }
        return out;
    }
    public ClubConfig config() {
        return cfg;
    }
    private CourtDayCalendar calendar(CourtDay key) {
        return calendars.computeIfAbsent(key,
                k -> new CourtDayCalendar(store.loadOccupiedMask(k.courtId(), k.day())));
    }
    private LockTable.Held lock(MemberDay member, CourtDay court) {
        return locking ? locks.acquire(member, court) : () -> { };
    }
    private void releaseExpiredHolds(CourtDay courtKey, CourtDayCalendar cal) {
        OffsetDateTime now = OffsetDateTime.now();
        for (BookingRef ref : store.findExpiredHolds(now)) {
            if (ref.courtId().equals(courtKey.courtId()) && ref.day().equals(courtKey.day())
                    && store.expire(ref.id(), now)) {
                cal.release(SlotMask.session(ref.startSlot()));
            }
        }
    }
    private List<Slot> suggest(BookingCommand cmd, LocalDate day, int requestedSlot) {
        long open = SlotMask.openStarts(cfg.openSlot(), cfg.closeSlot());
        boolean today = day.equals(LocalDate.now(IST));
        ZonedDateTime now = ZonedDateTime.now(IST);
        int nowSlot = now.getHour() * 2 + now.getMinute() / 30;
        List<Slot> all = new ArrayList<>();
        for (UUID court : store.courtsOfSameSport(cmd.courtId())) {
            long bits = calendar(new CourtDay(court, day)).startable(open);
            while (bits != 0) {
                int slot = Long.numberOfTrailingZeros(bits);
                bits &= bits - 1;
                if (today && slot <= nowSlot) {
                    continue;
                }
                all.add(new Slot(court, slot));
            }
        }
        all.sort(Comparator.comparingInt((Slot s) -> Math.abs(s.startSlot() - requestedSlot))
                .thenComparing(Slot::courtId));
        return List.copyOf(all.subList(0, Math.min(5, all.size())));
    }
}
