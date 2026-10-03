package com.bookmycourt.booking.engine;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class BookingEngine {

    public static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final Set<String> OCCUPYING_STATUSES =
            Set.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED");
    private static final Map<String, Object> LOCKS = new java.util.concurrent.ConcurrentHashMap<>();

    private final BookingRepository bookings;
    private final ClubCalendarService calendar;
    private final BookingStore store;
    private final Model.ClubConfig configured;

    @Autowired
    public BookingEngine(BookingRepository bookings, ClubCalendarService calendar) {
        this.bookings = bookings;
        this.calendar = calendar;
        this.store = null;
        this.configured = new Model.ClubConfig(12, 44, 2, 5);
    }

    public BookingEngine(BookingStore store, Model.ClubConfig config) {
        this.bookings = null;
        this.calendar = null;
        this.store = store;
        this.configured = config;
    }

    public Model.ClubConfig config() {
        return configured;
    }

    public long occupancy(UUID courtId, LocalDate date) {
        if (store != null) {
            return store.loadOccupiedMask(courtId, date);
        }
        int open = calendar.openSlot(date);
        int close = calendar.closeSlot(date);
        long mask = 0L;
        for (Booking booking : bookings.findByCourt_Id(courtId)) {
            if (!OCCUPYING_STATUSES.contains(booking.getStatus())) {
                continue;
            }
            ZonedDateTime start = booking.getStartTime().atZoneSameInstant(IST);
            ZonedDateTime end = booking.getEndTime().atZoneSameInstant(IST);
            if (!start.toLocalDate().equals(date)) {
                continue;
            }
            int from = Math.max(open, start.getHour() * 2 + start.getMinute() / 30);
            int to = Math.min(close, (int) Math.ceil(end.getHour() * 2 + end.getMinute() / 30.0));
            if (to > from) {
                mask |= SlotMask.range(from, to);
            }
        }
        return mask;
    }

    public List<Integer> startableSlots(UUID courtId, LocalDate date) {
        long openStarts = store == null ? calendar.openStarts(date)
                : SlotMask.openStarts(configured.openSlot(), configured.closeSlot());
        long free = ~occupancy(courtId, date);
        long freeStarts = free & (free >>> 1) & openStarts;
        return java.util.stream.IntStream.range(0, 48)
                .filter(slot -> (freeStarts & (1L << slot)) != 0)
                .boxed()
                .toList();
    }

    public Model.BookingResult book(Model.BookingCommand command, Model.PriceQuote price) {
        if (store == null) {
            throw new IllegalStateException("In-memory booking operations are unavailable on the JPA engine");
        }
        var local = command.start().atZoneSameInstant(IST);
        int startSlot = local.getHour() * 2 + local.getMinute() / 30;
        if (startSlot < configured.openSlot() || startSlot >= configured.closeSlot() - 1) {
            throw new Model.InvalidSlotException("Booking is outside club hours");
        }
        LocalDate day = local.toLocalDate();
        synchronized (LOCKS.computeIfAbsent(command.courtId() + ":" + day, ignored -> new Object())) {
            if (command.memberId() != null
                    && store.countActiveForMemberDay(command.memberId(), day) >= configured.dailyCap()) {
                throw new Model.CapExceededException();
            }
            if ((store.loadOccupiedMask(command.courtId(), day) & SlotMask.session(startSlot)) != 0) {
                throw new Model.SlotTakenException(List.of(), day);
            }
            var expires = command.channel() == Model.Channel.ONLINE
                    ? command.start().plusMinutes(configured.holdMinutes()) : null;
            String status = expires == null ? "CONFIRMED" : "PENDING";
            UUID id = store.insert(command, price, status, expires);
            return new Model.BookingResult(id, status, price.amount(), expires);
        }
    }
}
