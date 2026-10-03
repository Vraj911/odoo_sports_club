package com.bookmycourt.admin.service;

import com.bookmycourt.admin.entity.ClubHoliday;
import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubOpeningHoursRepository;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.common.event.events.SystemEvents.ClubConfigChanged;
import jakarta.annotation.PostConstruct;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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

    private final ClubOpeningHoursRepository hoursRepository;
    private final ClubHolidayRepository holidayRepository;

    private static final class CalendarSnapshot {
        final Map<Short, ClubOpeningHours> weeklyHours;
        final Set<LocalDate> holidays;

        CalendarSnapshot(List<ClubOpeningHours> hoursList, List<ClubHoliday> holidayList) {
            Map<Short, ClubOpeningHours> m = new HashMap<>();
            for (ClubOpeningHours h : hoursList) {
                m.put(h.getWeekday(), h);
            }
            this.weeklyHours = Map.copyOf(m);

            Set<LocalDate> s = new HashSet<>();
            for (ClubHoliday holiday : holidayList) {
                if (holiday.isActive()) {
                    s.add(holiday.getHolidayDate());
                }
            }
            this.holidays = Set.copyOf(s);
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

    @EventListener
    public void onConfigChanged(ClubConfigChanged event) {
        rebuild();
    }

    public void rebuild() {
        List<ClubOpeningHours> hours = hoursRepository.findAll();
        List<ClubHoliday> holidays = holidayRepository.findAll();
        snapshot.set(new CalendarSnapshot(hours, holidays));
    }

    public boolean isClosed(LocalDate date) {
        return hours(date).isEmpty();
    }

    public Optional<DayHours> hours(LocalDate date) {
        CalendarSnapshot snap = snapshot.get();
        if (snap == null) {
            return Optional.of(new DayHours(LocalTime.of(6, 0), LocalTime.of(22, 0)));
        }

        if (snap.holidays.contains(date)) {
            return Optional.empty();
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
        if (snap != null && snap.holidays.contains(date)) {
            return DayType.HOLIDAY;
        }
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return DayType.WEEKEND;
        }
        return DayType.WEEKDAY;
    }

    public long openStarts(LocalDate date) {
        int open = openSlot(date);
        int close = closeSlot(date);
        if (close <= open) {
            return 0L;
        }
        return SlotMask.openStarts(open, close);
    }
}
