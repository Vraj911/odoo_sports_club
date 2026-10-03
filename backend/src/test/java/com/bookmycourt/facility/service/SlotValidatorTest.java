package com.bookmycourt.facility.service;

import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubOpeningHoursRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.time.ClubTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class SlotValidatorTest {

    private ClubCalendarService calendarService;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        ClubOpeningHoursRepository hoursRepo = Mockito.mock(ClubOpeningHoursRepository.class);
        ClubHolidayRepository holidayRepo = Mockito.mock(ClubHolidayRepository.class);

        List<ClubOpeningHours> hours = new ArrayList<>();
        for (short i = 1; i <= 7; i++) {
            hours.add(new ClubOpeningHours(i, LocalTime.of(6, 0), LocalTime.of(22, 0), false));
        }
        when(hoursRepo.findAll()).thenReturn(hours);
        when(holidayRepo.findAll()).thenReturn(List.of());

        calendarService = new ClubCalendarService(hoursRepo, holidayRepo);
        calendarService.rebuild();

        // Fix clock at 2026-10-05 10:00:00 IST (a Monday)
        Instant fixedInstant = OffsetDateTime.of(2026, 10, 5, 10, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30)).toInstant();
        fixedClock = Clock.fixed(fixedInstant, ClubTime.IST);
    }

    @Test
    void testValidSlot() {
        OffsetDateTime slot = OffsetDateTime.of(2026, 10, 5, 14, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
        assertDoesNotThrow(() -> SlotValidator.validate(slot, 7, calendarService, fixedClock));
    }

    @Test
    void testInvalidBoundary() {
        OffsetDateTime oddMinutes = OffsetDateTime.of(2026, 10, 5, 14, 15, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
        DomainException ex = assertThrows(DomainException.class, () ->
                SlotValidator.validate(oddMinutes, 7, calendarService, fixedClock));
        assertEquals(ErrorCode.INVALID_SLOT, ex.getErrorCode());
    }

    @Test
    void testPastSlot() {
        OffsetDateTime pastSlot = OffsetDateTime.of(2026, 10, 5, 9, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
        DomainException ex = assertThrows(DomainException.class, () ->
                SlotValidator.validate(pastSlot, 7, calendarService, fixedClock));
        assertEquals(ErrorCode.INVALID_SLOT, ex.getErrorCode());
    }

    @Test
    void testTooFarAhead() {
        OffsetDateTime farAhead = OffsetDateTime.of(2026, 10, 20, 14, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
        DomainException ex = assertThrows(DomainException.class, () ->
                SlotValidator.validate(farAhead, 7, calendarService, fixedClock));
        assertEquals(ErrorCode.TOO_FAR_AHEAD, ex.getErrorCode());
    }

    @Test
    void testOutsideHours() {
        // Club closes at 22:00, last startable 60-min session is 21:00 (slot 42). 21:30 (slot 43) exceeds close-2.
        OffsetDateTime tooLate = OffsetDateTime.of(2026, 10, 5, 21, 30, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
        DomainException ex = assertThrows(DomainException.class, () ->
                SlotValidator.validate(tooLate, 7, calendarService, fixedClock));
        assertEquals(ErrorCode.OUTSIDE_HOURS, ex.getErrorCode());
    }
}
