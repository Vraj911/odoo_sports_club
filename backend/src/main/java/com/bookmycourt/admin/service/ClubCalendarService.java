package com.bookmycourt.admin.service;

import com.bookmycourt.admin.entity.ClubHoliday;
import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubOpeningHoursRepository;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.common.event.events.SystemEvents.ClubConfigChanged;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class ClubCalendarService {

    public record DayHours(LocalTime open, LocalTime close) {
    }

    public enum DayType {
        WEEKDAY,
        WEEKEND,
        HOLIDAY
    }

    /** Active holiday: either a full closure or special opening hours. */
    private record HolidayRule(boolean closed, LocalTime open, LocalTime close) {
    }

    private final ClubOpeningHoursRepository hoursRepository;
    private final ClubHolidayRepository holidayRepository;

    private static final class CalendarSnapshot {
        final Map<Short, ClubOpeningHours> weeklyHours;
        final Map<LocalDate, HolidayRule> holidays;

        CalendarSnapshot(List<ClubOpeningHours> hoursList, List<ClubHoliday> holidayList) {
            Map<Short, ClubOpeningHours> m = new HashMap<>();
            for (ClubOpeningHours h : hoursList) {
                m.put(h.getWeekday(), h);
            }
            this.weeklyHours = Map.copyOf(m);

            Map<LocalDate, HolidayRule> hm = new HashMap<>();
            for (ClubHoliday h : holidayList) {
                if (h.isActive()) {
                    hm.put(h.getHolidayDate(), new HolidayRule(h.isClosed(), h.getOpenTime(), h.getCloseTime()));
                }
            }
            this.holidays = Map.copyOf(hm);
        }
    }

    private final AtomicReference<CalendarSnapshot> snapshot = new AtomicReference<>();

    public ClubCalendarService(ClubOpeningHoursRepository hoursRepository,
                               ClubHolidayRepository holidayRepository) {
        this.hoursRepository = hoursRepository;
        this.holidayRepository = holidayRepository;
    }

    @PostConstruct
    public void init() {
        rebuild();
    }

    /**
     * AFTER_COMMIT so the cache is never rebuilt from (or poisoned by) a transaction that later rolls back.
     * fallbackExecution keeps it working when the event is published outside a transaction.
     * NOTE: requires DomainEventPublisher to delegate to Spring's ApplicationEventPublisher.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onConfigChanged(ClubConfigChanged event) {
        rebuild();
    }

    public void rebuild() {
        List<ClubOpeningHours> hours = hoursRepository.findAll();
        List<ClubHoliday> holidays = holidayRepository.findAll();
        snapshot.set(new CalendarSnapshot(hours, holidays));
    }

    public List<ClubOpeningHours> weeklySchedule() {
        CalendarSnapshot snap = snapshot.get();
        return snap == null ? List.of() : List.copyOf(snap.weeklyHours.values());
    }

    public boolean isClosed(LocalDate date) {
        return hours(date).isEmpty();
    }

    public Optional<DayHours> hours(LocalDate date) {
        CalendarSnapshot snap = snapshot.get();
        if (snap == null) {
            return Optional.of(new DayHours(LocalTime.of(6, 0), LocalTime.of(22, 0)));
        }

        HolidayRule holiday = snap.holidays.get(date);
        if (holiday != null) {
            if (holiday.closed() || holiday.open() == null || holiday.close() == null) {
                return Optional.empty();
            }
            return Optional.of(new DayHours(holiday.open(), holiday.close()));
        }

        short weekday = (short) date.getDayOfWeek().getValue();
        ClubOpeningHours oh = snap.weeklyHours.get(weekday);
        if (oh == null || oh.isClosed()) {
            return Optional.empty();
        }

        return Optional.of(new DayHours(oh.getOpenTime(), oh.getCloseTime()));
    }

    public int openSlot(LocalDate date) {
        return hours(date)
                .map(h -> h.open().getHour() * 2 + h.open().getMinute() / 30)
                .orElse(12); // Default 06:00
    }

    public int closeSlot(LocalDate date) {
        return hours(date)
                .map(h -> h.close().getHour() * 2 + h.close().getMinute() / 30)
                .orElse(44); // Default 22:00
    }

    public DayType dayType(LocalDate date) {
        CalendarSnapshot snap = snapshot.get();
        if (snap != null && snap.holidays.containsKey(date)) {
            return DayType.HOLIDAY;
        }
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return DayType.WEEKEND;
        }
        return DayType.WEEKDAY;
    }

    /** FIX: a closed day / full-closure holiday used to fall back to the 06:00-22:00 default and look bookable. */
    public long openStarts(LocalDate date) {
        if (isClosed(date)) {
            return 0L;
        }
        int open = openSlot(date);
        int close = closeSlot(date);
        if (close <= open) {
            return 0L;
        }
        return SlotMask.openStarts(open, close);
    }
}