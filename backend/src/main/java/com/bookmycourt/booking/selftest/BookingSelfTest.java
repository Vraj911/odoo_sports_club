package com.bookmycourt.booking.selftest;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.service.BookingService;
import com.bookmycourt.booking.service.CalendarRegistry;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.SQLException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Double-booking self-test. Runs ONCE at startup, only when
 * booking.selftest.enabled=true. It uses a court-day that has no bookings at
 * all, creates test bookings (source = SELFTEST) through the real
 * BookingService, checks the results and the database, then deletes everything
 * it created. Read the console for "SELFTEST RESULT". Turn the property off
 * again afterwards. Use on your local/dev database, not on a database with real
 * customers.
 */
@Component
@ConditionalOnProperty(name = "booking.selftest.enabled", havingValue = "true")
public class BookingSelfTest implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BookingSelfTest.class);
    private static final String LIVE = "('PENDING','CONFIRMED','CHECKED_IN','COMPLETED')";
    private static final int REPEAT = 4;

    private record Target(Court court, LocalDate day, List<String> times) {

    }

    private record Outcome(String time, boolean ok, String detail) {

        boolean takenRejection() {
            if (ok || detail == null || detail.startsWith("UNEXPECTED")) {
                return false;
            }
            String d = detail.toLowerCase();
            return d.contains("occupied") || d.contains("taken");
        }
    }

    private final BookingService bookingService;
    private final CourtRepository courts;
    private final ClubCalendarService calendar;
    private final CalendarRegistry registry;
    private final JdbcClient jdbc;
    private final PlatformTransactionManager txm;
    private final Clock clock;

    private final List<String> failures = new ArrayList<>();
    private final AtomicInteger phone = new AtomicInteger(1);
    private int checks = 0;

    public BookingSelfTest(BookingService bookingService, CourtRepository courts, ClubCalendarService calendar,
            CalendarRegistry registry, JdbcClient jdbc, PlatformTransactionManager txm, Clock clock) {
        this.bookingService = bookingService;
        this.courts = courts;
        this.calendar = calendar;
        this.registry = registry;
        this.jdbc = jdbc;
        this.txm = txm;
        this.clock = clock;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("==================== BOOKING SELF-TEST START ====================");
        Target target = null;
        try {
            deleteSelfTestRows();
            target = findEmptyCourtDay();
            if (target == null) {
                log.warn("SELFTEST SKIPPED: no court-day in the next 5 days is completely empty. "
                        + "Use a database with a free court or day, or cancel the bookings on one court for one day.");
                return;
            }
            log.info("Testing court '{}' on {} with {} start times", target.court().getName(), target.day(), target.times().size());

            sequentialMiddleSlotTest(target);
            databaseConstraintProbe(target);
            cleanup(target);

            concurrentAllSlotsTest(target);
            cleanup(target);
        } catch (Throwable t) {
            log.error("SELFTEST ABORTED. This is an error in running the test (see the stack trace); it may or may not be a booking bug.", t);
            failures.add("aborted: " + t);
        } finally {
            if (target != null) {
                try {
                    cleanup(target);
                } catch (Exception e) {
                    log.warn("Final cleanup failed: {}", e.getMessage());
                }
            }
            if (failures.isEmpty()) {
                log.info("SELFTEST RESULT: PASS ({} checks)", checks);
            } else {
                log.error("SELFTEST RESULT: FAIL ({} of {} checks failed)", failures.size(), checks);
                failures.forEach(f -> log.error("   FAILED: {}", f));
            }
            log.info("==================== BOOKING SELF-TEST END ======================");
        }
    }

    // ------------------------------------------------------------------ tests
    /**
     * What two browsers do, but deterministic: same middle slot twice, then the
     * overlapping neighbours.
     */
    private void sequentialMiddleSlotTest(Target t) {
        List<String> times = t.times();
        if (times.size() < 7) {
            log.warn("Sequential test skipped: not enough start times");
            return;
        }
        int m = times.size() / 2;
        String mid = times.get(m);

        check("middle slot " + mid + ": first booking succeeds", book(t, mid));
        checkTaken("middle slot " + mid + ": same slot again is rejected", book(t, mid));
        checkTaken("middle slot: booking 30 min LATER (" + times.get(m + 1) + ") overlaps, rejected", book(t, times.get(m + 1)));
        checkTaken("middle slot: booking 30 min EARLIER (" + times.get(m - 1) + ") overlaps, rejected", book(t, times.get(m - 1)));
        check("middle slot: back-to-back booking 60 min later (" + times.get(m + 2) + ") is allowed", book(t, times.get(m + 2)));
        check("middle slot: back-to-back booking 60 min earlier (" + times.get(m - 2) + ") is allowed", book(t, times.get(m - 2)));
    }

    /**
     * Proves Postgres itself rejects an overlap, independent of any Java code.
     */
    private void databaseConstraintProbe(Target t) {
        List<String> times = t.times();
        if (times.size() < 7) {
            return;
        }
        String mid = times.get(times.size() / 2);
        OffsetDateTime s = ZonedDateTime.of(t.day(), LocalTime.parse(mid), ClubTime.IST).toOffsetDateTime();
        OffsetDateTime e = s.plusMinutes(60);

        String state;
        try {
            new TransactionTemplate(txm).executeWithoutResult(status -> {
                jdbc.sql("""
                        INSERT INTO occupancy (id, court_id, occupancy_type, occupied_period, status, reason)
                        VALUES (:id, :court, 'MAINTENANCE', tstzrange(:s, :e, '[)'), 'ACTIVE', 'selftest-probe')
                        """)
                        .param("id", UUID.randomUUID()).param("court", t.court().getId())
                        .param("s", s).param("e", e).update();
                status.setRollbackOnly();
            });
            state = "ACCEPTED (no constraint stopped the overlap)";
        } catch (Exception ex) {
            state = sqlState(ex);
        }
        checks++;
        if ("23P01".equals(state)) {
            log.info("  PASS  database: Postgres rejects an overlapping occupancy row (exclusion constraint works)");
        } else {
            log.error("  FAIL  database: expected SQLSTATE 23P01 (exclusion violation), got: {}", state);
            failures.add("database exclusion constraint on occupancy did not reject an overlap: " + state);
        }

        Long bookingGuard = jdbc.sql("SELECT COUNT(*) FROM pg_constraint WHERE conname = 'no_booking_overlap'")
                .query(Long.class).single();
        log.info("  NOTE  booking-table overlap constraint (no_booking_overlap) present: {}", bookingGuard != null && bookingGuard > 0);
    }

    /**
     * Every start time of the day, several simultaneous requests each.
     */
    private void concurrentAllSlotsTest(Target t) throws Exception {
        List<String> times = t.times();
        int total = times.size() * REPEAT;
        ExecutorService pool = Executors.newFixedThreadPool(Math.min(48, total));
        CountDownLatch gate = new CountDownLatch(1);
        List<Future<Outcome>> futures = new ArrayList<>();
        for (String time : times) {
            for (int r = 0; r < REPEAT; r++) {
                futures.add(pool.submit(() -> {
                    gate.await();
                    return book(t, time);
                }));
            }
        }
        gate.countDown();

        List<String> wins = new ArrayList<>();
        int taken = 0;
        List<String> other = new ArrayList<>();
        for (Future<Outcome> f : futures) {
            Outcome o = f.get();
            if (o.ok()) {
                wins.add(o.time()); 
            }else if (o.takenRejection()) {
                taken++; 
            }else {
                other.add(o.time() + " -> " + o.detail());
            }
        }
        pool.shutdown();
        log.info("Concurrent run: {} requests, {} succeeded, {} rejected as slot-taken, {} other",
                total, wins.size(), taken, other.size());

        checks++;
        if (wins.isEmpty()) {
            log.error("  FAIL  concurrent: nothing succeeded, so the test proves nothing");
            failures.add("concurrent: no booking succeeded at all");
        } else {
            log.info("  PASS  concurrent: bookings were accepted ({} winners)", wins.size());
        }

        checks++;
        if (other.isEmpty()) {
            log.info("  PASS  concurrent: every request ended as success or a clean slot-taken rejection");
        } else {
            log.error("  FAIL  concurrent: {} requests failed in some other way, e.g. {}", other.size(), other.get(0));
            failures.add("concurrent: unexpected errors, e.g. " + other.get(0));
        }

        List<String> clashes = new ArrayList<>();
        for (int i = 0; i < wins.size(); i++) {
            for (int j = i + 1; j < wins.size(); j++) {
                if (Math.abs(minutes(wins.get(i)) - minutes(wins.get(j))) < 60) {
                    clashes.add(wins.get(i) + " & " + wins.get(j));
                }
            }
        }
        checks++;
        if (clashes.isEmpty()) {
            log.info("  PASS  concurrent: no two successful bookings overlap, on any slot of the day");
        } else {
            log.error("  FAIL  concurrent: overlapping successes: {}", clashes);
            failures.add("concurrent: overlapping successful bookings " + clashes);
        }

        Long overlaps = count("""
                SELECT COUNT(*) FROM booking a JOIN booking b
                  ON a.court_id = b.court_id AND a.id < b.id
                 AND tstzrange(a.start_time, a.end_time, '[)') && tstzrange(b.start_time, b.end_time, '[)')
                WHERE a.source = 'SELFTEST' AND b.source = 'SELFTEST'
                  AND a.status IN %s AND b.status IN %s""".formatted(LIVE, LIVE));
        Long missing = count("""
                SELECT COUNT(*) FROM booking b
                WHERE b.source = 'SELFTEST' AND b.status IN %s
                  AND NOT EXISTS (SELECT 1 FROM occupancy o WHERE o.booking_id = b.id AND o.status = 'ACTIVE')""".formatted(LIVE));
        Long liveInDb = count("SELECT COUNT(*) FROM booking WHERE source = 'SELFTEST' AND status IN " + LIVE);

        checks++;
        if (overlaps == 0) {
            log.info("  PASS  database: no overlapping bookings stored"); 
        }else {
            log.error("  FAIL  database: {} overlapping booking pairs stored", overlaps);
            failures.add("database has overlapping bookings: " + overlaps);
        }
        checks++;
        if (missing == 0) {
            log.info("  PASS  database: every booking has its occupancy row"); 
        }else {
            log.error("  FAIL  database: {} bookings have no occupancy row", missing);
            failures.add("bookings missing occupancy rows: " + missing);
        }
        checks++;
        if (liveInDb == wins.size()) {
            log.info("  PASS  database: stored bookings ({}) match successful requests", liveInDb); 
        }else {
            log.error("  FAIL  database: {} stored vs {} successful", liveInDb, wins.size());
            failures.add("stored bookings " + liveInDb + " != successes " + wins.size());
        }
    }

    // ---------------------------------------------------------------- helpers
    private Outcome book(Target t, String time) {
        try {
            BookingResponse r = bookingService.create(new CreateBookingRequest(
                    t.court().getId(), null, "SelfTest", String.format("90000%05d", phone.getAndIncrement()),
                    t.day(), time, "ONLINE", "PAY_NOW", false, null, "SELFTEST"));
            return new Outcome(time, true, String.valueOf(r.id()));
        } catch (DomainException e) {
            return new Outcome(time, false, e.getMessage());
        } catch (Exception e) {
            return new Outcome(time, false, "UNEXPECTED " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private void check(String name, Outcome o) {
        checks++;
        if (o.ok()) {
            log.info("  PASS  {}", name);
        } else {
            log.error("  FAIL  {} (got: {})", name, o.detail());
            failures.add(name + " (got: " + o.detail() + ")");
        }
    }

    private void checkTaken(String name, Outcome o) {
        checks++;
        if (o.takenRejection()) {
            log.info("  PASS  {}", name);
        } else {
            log.error("  FAIL  {} (got: {})", name, o.ok() ? "BOOKING WAS ACCEPTED, DOUBLE BOOKING" : o.detail());
            failures.add(name + " (got: " + (o.ok() ? "ACCEPTED" : o.detail()) + ")");
        }
    }

    private static int minutes(String hhmm) {
        LocalTime t = LocalTime.parse(hhmm);
        return t.getHour() * 60 + t.getMinute();
    }

    private Long count(String sql) {
        Long n = jdbc.sql(sql).query(Long.class).single();
        return n == null ? 0L : n;
    }

    private static String sqlState(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof SQLException se && se.getSQLState() != null) {
                return se.getSQLState();
            }
        }
        return "no SQL state: " + ex.getClass().getSimpleName() + ": " + ex.getMessage();
    }

    /**
     * A court-day with no live bookings, no active occupancy and an empty
     * in-memory calendar.
     */
    private Target findEmptyCourtDay() {
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        for (Court c : courts.findByActiveTrueOrderByNameAsc()) {
            for (int d = 1; d <= 5; d++) {
                LocalDate day = today.plusDays(d);
                if (calendar.isClosed(day)) {
                    continue;
                }
                OffsetDateTime from = day.atStartOfDay(ClubTime.IST).toOffsetDateTime();
                OffsetDateTime to = day.plusDays(1).atStartOfDay(ClubTime.IST).toOffsetDateTime();
                Long bookings = jdbc.sql("SELECT COUNT(*) FROM booking WHERE court_id = :c AND status IN " + LIVE
                        + " AND start_time >= :f AND start_time < :t")
                        .param("c", c.getId()).param("f", from).param("t", to).query(Long.class).single();
                Long occupancy = jdbc.sql("SELECT COUNT(*) FROM occupancy WHERE court_id = :c AND status = 'ACTIVE'"
                        + " AND occupied_period && tstzrange(:f, :t, '[)')")
                        .param("c", c.getId()).param("f", from).param("t", to).query(Long.class).single();
                CourtDayCalendar cal = registry.get(c.getId(), day);
                if ((bookings == null || bookings == 0) && (occupancy == null || occupancy == 0) && cal.occupied() == 0) {
                    List<String> times = new ArrayList<>();
                    for (int slot = calendar.openSlot(day); slot <= calendar.closeSlot(day) - 2; slot++) {
                        times.add(LocalTime.of(slot / 2, (slot % 2) * 30).toString());
                    }
                    return new Target(c, day, times);
                }
            }
        }
        return null;
    }

    private void deleteSelfTestRows() {
        jdbc.sql("DELETE FROM occupancy WHERE booking_id IN (SELECT id FROM booking WHERE source = 'SELFTEST')").update();
        jdbc.sql("DELETE FROM occupancy WHERE reason = 'selftest-probe'").update();
        jdbc.sql("DELETE FROM booking WHERE source = 'SELFTEST'").update();
    }

    /**
     * Removes test data and clears the in-memory bits for the tested court-day
     * (it was empty before the test).
     */
    private void cleanup(Target t) {
        deleteSelfTestRows();
        CourtDayCalendar cal = registry.get(t.court().getId(), t.day());
        cal.releaseBooked(-1L);
        cal.releaseHeld(-1L);
    }
}
