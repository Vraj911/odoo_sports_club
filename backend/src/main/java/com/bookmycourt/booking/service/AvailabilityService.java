package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AvailabilityService {

    private final CalendarRegistry calendarRegistry;
    private final CourtRepository courtRepository;
    private final ClubCalendarService clubCalendarService;

    public AvailabilityService(
            CalendarRegistry calendarRegistry,
            CourtRepository courtRepository,
            ClubCalendarService clubCalendarService
    ) {
        this.calendarRegistry = calendarRegistry;
        this.courtRepository = courtRepository;
        this.clubCalendarService = clubCalendarService;
    }

    public record SlotStatus(int slot, String time, String status) {}

    public record CourtSlotGrid(
            UUID courtId,
            String courtName,
            String sport,
            boolean indoor,
            LocalDate date,
            List<SlotStatus> slots,
            List<String> startableTimes
    ) {}

    public List<CourtSlotGrid> grid(LocalDate day, String sport) {
        List<Court> courts = (sport == null || sport.isBlank())
                ? courtRepository.findByActiveTrueOrderByNameAsc()
                : courtRepository.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(SportMapper.toDbSport(sport));

        int openSlot = clubCalendarService.openSlot(day);
        int closeSlot = clubCalendarService.closeSlot(day);
        long openStarts = clubCalendarService.openStarts(day);
        boolean clubClosed = clubCalendarService.isClosed(day);

        List<CourtSlotGrid> result = new ArrayList<>();
        for (Court court : courts) {
            CourtDayCalendar cal = calendarRegistry.get(court.getId(), day);
            long booked = cal.bookedMask();
            long held = cal.heldMask();
            long social = cal.socialMask();
            long blocked = cal.blockedMask();

            List<SlotStatus> slotStatuses = new ArrayList<>(48);
            for (int slot = 0; slot < 48; slot++) {
                int hour = slot / 2;
                int min = (slot % 2) * 30;
                String timeStr = String.format("%02d:%02d", hour, min);
                long bit = 1L << slot;

                String status;
                if (clubClosed || slot < openSlot || slot >= closeSlot) {
                    status = "BLOCKED";
                } else if ((blocked & bit) != 0) {
                    status = "BLOCKED";
                } else if ((social & bit) != 0) {
                    status = "SOCIAL";
                } else if ((held & bit) != 0) {
                    status = "HELD";
                } else if ((booked & bit) != 0) {
                    status = "BOOKED";
                } else {
                    status = "FREE";
                }
                slotStatuses.add(new SlotStatus(slot, timeStr, status));
            }

            List<String> startableTimes = new ArrayList<>();
            long startableBits = cal.startable(openStarts);
            while (startableBits != 0) {
                int s = Long.numberOfTrailingZeros(startableBits);
                int h = s / 2;
                int m = (s % 2) * 30;
                startableTimes.add(String.format("%02d:%02d", h, m));
                startableBits &= startableBits - 1;
            }

            result.add(new CourtSlotGrid(
                    court.getId(),
                    court.getName(),
                    SportMapper.toApiSport(court.getSport()),
                    SportMapper.indoor(court),
                    day,
                    slotStatuses,
                    startableTimes
            ));
        }
        return result;
    }

    public List<CourtSlotGrid> publicGrid(LocalDate day, String sport) {
        List<CourtSlotGrid> full = grid(day, sport);
        return full.stream().map(g -> new CourtSlotGrid(
                g.courtId(),
                g.courtName(),
                g.sport(),
                g.indoor(),
                g.date(),
                g.slots().stream().map(s -> new SlotStatus(
                        s.slot(),
                        s.time(),
                        "FREE".equals(s.status()) ? "FREE" : "BUSY"
                )).toList(),
                g.startableTimes()
        )).toList();
    }
}
