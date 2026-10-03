package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.common.concurrency.Keys;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CalendarRegistry {

    private final ConcurrentHashMap<Keys.CourtDay, CourtDayCalendar> calendars = new ConcurrentHashMap<>();

    public CourtDayCalendar get(Keys.CourtDay key) {
        return calendars.computeIfAbsent(key, k -> new CourtDayCalendar());
    }

    public CourtDayCalendar get(UUID courtId, LocalDate day) {
        return get(new Keys.CourtDay(courtId, day));
    }

    public void put(Keys.CourtDay key, CourtDayCalendar calendar) {
        calendars.put(key, calendar);
    }

    public void clear() {
        calendars.clear();
    }

    public Map<Keys.CourtDay, CourtDayCalendar> snapshot() {
        return Map.copyOf(calendars);
    }
}
