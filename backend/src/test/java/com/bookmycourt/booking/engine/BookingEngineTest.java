package com.bookmycourt.booking.engine;

import com.bookmycourt.booking.engine.Model.BookingCommand;
import com.bookmycourt.booking.engine.Model.Channel;
import com.bookmycourt.booking.engine.Model.ClubConfig;
import com.bookmycourt.booking.engine.Model.PriceQuote;
import com.bookmycourt.booking.engine.Model.SlotTakenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BookingEngineTest {

    private static final ClubConfig CFG = new ClubConfig(12, 44, 2, 5);
    private InMemoryBookingStore store;
    private BookingEngine engine;
    private UUID courtA;
    private UUID courtB;
    private UUID member;

    @BeforeEach
    void setUp() {
        store = new InMemoryBookingStore();
        courtA = UUID.fromString("00000000-0000-0000-0000-0000000000a1");
        courtB = UUID.fromString("00000000-0000-0000-0000-0000000000a2");
        member = UUID.fromString("00000000-0000-0000-0000-0000000000b1");
        store.addCourt(courtA, "TENNIS");
        store.addCourt(courtB, "TENNIS");
        engine = new BookingEngine(store, CFG);
    }

    @Test
    void secondOverlappingBookIsRejected() {
        OffsetDateTime start = futureSlot(10, 0);
        engine.book(cmd(courtA, member, start), gold());
        assertThrows(SlotTakenException.class, () -> engine.book(cmd(courtA, member, start), gold()));
    }

    @Test
    void concurrentBooksOnSameSlotOnlyOneWins() throws Exception {
        OffsetDateTime start = futureSlot(11, 0);
        int threads = 20;
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger wins = new AtomicInteger();
        AtomicInteger conflicts = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            UUID m = UUID.randomUUID();
            Thread t = new Thread(() -> {
                try {
                    startGate.await();
                    engine.book(cmd(courtA, m, start), gold());
                    wins.incrementAndGet();
                } catch (SlotTakenException ex) {
                    conflicts.incrementAndGet();
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
            t.start();
        }
        startGate.countDown();
        done.await();
        assertEquals(1, wins.get());
        assertEquals(threads - 1, conflicts.get());
    }

    @Test
    void occupyMaskUsesTwoAdjacentBits() {
        OffsetDateTime start = futureSlot(12, 0);
        engine.book(cmd(courtA, member, start), gold());
        LocalDate day = start.atZoneSameInstant(BookingEngine.IST).toLocalDate();
        int slot = 12 * 2;
        long mask = engine.occupancy(courtA, day);
        assertEquals(SlotMask.session(slot), mask & SlotMask.session(slot));
        assertTrue(engine.startableSlots(courtA, day).stream().noneMatch(s -> s == slot || s == slot - 1));
    }

    @Test
    void doubleBookingPreventedAtLastSlotOfOperatingHours() {
        // Club hours: 06:00 (slot 12) to 22:00 (slot 44). Last 60-min slot starts at 21:00 (slot 42).
        OffsetDateTime lastSlot = futureSlot(21, 0);
        UUID member2 = UUID.randomUUID();
        UUID member3 = UUID.randomUUID();

        // 1. First booking succeeds at the last slot
        var result = engine.book(cmd(courtA, member, lastSlot), gold());
        assertEquals("PENDING", result.status());

        // 2. Second booking at the EXACT SAME last slot is rejected
        assertThrows(SlotTakenException.class, () ->
                engine.book(cmd(courtA, member2, lastSlot), gold()));

        // 3. Overlapping booking on the preceding 30-min slot (20:30, slot 41) also conflicts with slot 42
        OffsetDateTime overlapSlot = futureSlot(20, 30);
        assertThrows(SlotTakenException.class, () ->
                engine.book(cmd(courtA, member3, overlapSlot), gold()));
    }

    @Test
    void bookingPastLastSlotThrowsInvalidSlotException() {
        // 21:30 is slot 43 (closeSlot 44 - 1); a 60-min session extends past closing time
        OffsetDateTime pastLastSlot = futureSlot(21, 30);
        assertThrows(Model.InvalidSlotException.class, () ->
                engine.book(cmd(courtA, member, pastLastSlot), gold()));

        // 22:00 is slot 44 (closeSlot); outside club hours
        OffsetDateTime atClosingSlot = futureSlot(22, 0);
        assertThrows(Model.InvalidSlotException.class, () ->
                engine.book(cmd(courtA, member, atClosingSlot), gold()));
    }

    private static BookingCommand cmd(UUID court, UUID memberId, OffsetDateTime start) {
        return new BookingCommand(court, memberId, null, null, start, Channel.ONLINE);
    }

    private static PriceQuote gold() {
        return new PriceQuote(BigDecimal.ZERO, "GOLD");
    }

    private static OffsetDateTime futureSlot(int hour, int minute) {
        ZonedDateTime now = ZonedDateTime.now(BookingEngine.IST).plusDays(1)
                .withHour(hour).withMinute(minute).withSecond(0).withNano(0);
        if (now.getDayOfWeek().getValue() == 0) {
            now = now.plusDays(1);
        }
        return now.withZoneSameInstant(ZoneOffset.UTC).toOffsetDateTime();
    }
}
