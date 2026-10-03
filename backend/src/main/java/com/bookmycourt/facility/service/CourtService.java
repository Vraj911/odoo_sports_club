package com.bookmycourt.facility.service;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.facility.dto.CourtResponse;
import com.bookmycourt.facility.dto.CreateCourtRequest;
import com.bookmycourt.facility.dto.SlotDto;
import com.bookmycourt.facility.dto.UpdateCourtRequest;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.mapper.CourtMapper;
import com.bookmycourt.facility.repository.CourtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class CourtService {

    private final CourtRepository courts;
    private final CourtMapper mapper;
    private final BookingEngine bookingEngine;
    private final ClubCalendarService calendarService;

    public CourtService(CourtRepository courts,
                        CourtMapper mapper,
                        BookingEngine bookingEngine,
                        ClubCalendarService calendarService) {
        this.courts = courts;
        this.mapper = mapper;
        this.bookingEngine = bookingEngine;
        this.calendarService = calendarService;
    }

    @Transactional(readOnly = true)
    public List<CourtResponse> list(String sport) {
        var rows = (sport == null || sport.isBlank())
                ? courts.findByActiveTrueOrderByNameAsc()
                : courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(SportMapper.toDbSport(sport));
        return rows.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CourtResponse get(UUID id) {
        return courts.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + id));
    }

    @Transactional
    public CourtResponse create(CreateCourtRequest req) {
        Court court = new Court();
        court.setName(req.name());
        court.setSport(SportMapper.toDbSport(req.sport()));
        court.setIndoorOutdoor(req.indoorOutdoor() != null ? req.indoorOutdoor().toUpperCase() : "INDOOR");
        court.setLocation(req.location());
        court.setSlotDurationMinutes(req.slotDurationMinutes() != null ? req.slotDurationMinutes() : 60);
        court.setSlotIntervalMinutes(req.slotIntervalMinutes() != null ? req.slotIntervalMinutes() : 30);
        court.setActive(true);
        courts.save(court);
        return mapper.toResponse(court);
    }

    @Transactional
    public CourtResponse update(UUID id, UpdateCourtRequest req) {
        Court court = courts.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + id));
        if (req.name() != null) court.setName(req.name());
        if (req.sport() != null) court.setSport(SportMapper.toDbSport(req.sport()));
        if (req.indoorOutdoor() != null) court.setIndoorOutdoor(req.indoorOutdoor().toUpperCase());
        if (req.location() != null) court.setLocation(req.location());
        if (req.slotDurationMinutes() != null) court.setSlotDurationMinutes(req.slotDurationMinutes());
        if (req.slotIntervalMinutes() != null) court.setSlotIntervalMinutes(req.slotIntervalMinutes());
        if (req.active() != null) court.setActive(req.active());
        courts.save(court);
        return mapper.toResponse(court);
    }

    @Transactional
    public CourtResponse setActive(UUID id, boolean active) {
        Court court = courts.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + id));
        court.setActive(active);
        courts.save(court);
        return mapper.toResponse(court);
    }

    @Transactional(readOnly = true)
    public List<SlotDto> getSlots(UUID courtId, LocalDate date) {
        courts.findById(courtId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + courtId));

        if (date == null) {
            date = LocalDate.now();
        }

        long occupiedMask = bookingEngine.occupancy(courtId, date);
        List<Integer> startable = bookingEngine.startableSlots(courtId, date);
        Set<Integer> startableSet = Set.copyOf(startable);

        int open = calendarService.openSlot(date);
        int close = calendarService.closeSlot(date);

        List<SlotDto> slots = new ArrayList<>(48);
        for (int i = 0; i < 48; i++) {
            LocalTime start = LocalTime.of(i / 2, (i % 2) * 30);
            LocalTime end = start.plusMinutes(30);

            boolean isOccupied = ((occupiedMask >> i) & 1L) == 1L;
            boolean isWithinHours = i >= open && i < close;

            String status = "FREE";
            if (!isWithinHours) {
                status = "CLOSED";
            } else if (isOccupied) {
                status = "BOOKED";
            }

            slots.add(new SlotDto(i, start, end, status, startableSet.contains(i)));
        }

        return List.copyOf(slots);
    }
}
