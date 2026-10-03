package com.bookmycourt.facility.service;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.booking.service.CalendarRegistry;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.dto.CourtResponse;
import com.bookmycourt.facility.dto.CreateCourtRequest;
import com.bookmycourt.facility.dto.SlotDto;
import com.bookmycourt.facility.dto.UpdateCourtRequest;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.mapper.CourtMapper;
import com.bookmycourt.facility.repository.CourtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CourtService {

    private static final Set<String> INDOOR_OUTDOOR = Set.of("INDOOR", "OUTDOOR");

    private final CourtRepository courts;
    private final CourtMapper mapper;
    private final CalendarRegistry calendarRegistry;
    private final ClubCalendarService calendarService;
    private final BookingRepository bookings;
    private final Clock clock;

    public CourtService(CourtRepository courts,
            CourtMapper mapper,
            CalendarRegistry calendarRegistry,
            ClubCalendarService calendarService,
            BookingRepository bookings,
            Clock clock) {
        this.courts = courts;
        this.mapper = mapper;
        this.calendarRegistry = calendarRegistry;
        this.calendarService = calendarService;
        this.bookings = bookings;
        this.clock = clock;
    }

    // ------------------------------------------------------------ access
    private static boolean isManager() {
        Actor a = ActorHolder.current();
        return a != null && a.isManagerOrAbove();
    }

    private static void requireManager() {
        if (!isManager()) {
            // add ErrorCode.FORBIDDEN (HTTP 403) if you don't have it yet
            throw new DomainException(ErrorCode.FORBIDDEN, "Only a manager or admin can configure courts");
        }
    }

    // ------------------------------------------------------------- reads
    @Transactional(readOnly = true)
    public List<CourtResponse> list(String sport) {
        return list(sport, false);
    }

    @Transactional(readOnly = true)
    public List<CourtResponse> list(String sport, boolean includeInactive) {
        boolean all = includeInactive && isManager();
        boolean hasSport = sport != null && !sport.isBlank();
        String dbSport = hasSport ? SportMapper.toDbSport(sport) : null;

        List<Court> rows;
        if (all) {
            rows = hasSport ? courts.findBySportIgnoreCaseOrderByNameAsc(dbSport) : courts.findAllByOrderByNameAsc();
        } else {
            rows = hasSport
                    ? courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(dbSport)
                    : courts.findByActiveTrueOrderByNameAsc();
        }
        return rows.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CourtResponse get(UUID id) {
        return courts.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + id));
    }

    /**
     * Live slot grid for one court, from the same calendar BookingService
     * writes to.
     */
    @Transactional(readOnly = true)
    public List<SlotDto> getSlots(UUID courtId, LocalDate date) {
        Court court = courts.findById(courtId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + courtId));

        ZonedDateTime now = ZonedDateTime.now(clock.withZone(ClubTime.IST));
        LocalDate day = date != null ? date : now.toLocalDate();

        CourtDayCalendar cal = calendarRegistry.get(courtId, day);
        boolean closedDay = !court.isActive() || calendarService.isClosed(day);
        int open = calendarService.openSlot(day);
        int close = calendarService.closeSlot(day);
        long startable = closedDay ? 0L : cal.startable(calendarService.openStarts(day));

        boolean today = day.equals(now.toLocalDate());
        int nowSlot = now.getHour() * 2 + now.getMinute() / 30;

        List<SlotDto> slots = new ArrayList<>(48);
        for (int i = 0; i < 48; i++) {
            long bit = 1L << i;
            LocalTime start = LocalTime.of(i / 2, (i % 2) * 30);

            String status;
            if (closedDay || i < open || i >= close) {
                status = "CLOSED"; 
            }else if ((cal.blockedMask() & bit) != 0) {
                status = "BLOCKED"; 
            }else if ((cal.socialMask() & bit) != 0) {
                status = "SOCIAL"; 
            }else if ((cal.heldMask() & bit) != 0) {
                status = "HELD"; 
            }else if ((cal.bookedMask() & bit) != 0) {
                status = "BOOKED"; 
            }else {
                status = "FREE";
            }

            boolean canStart = (startable & bit) != 0 && (!today || i > nowSlot);
            slots.add(new SlotDto(i, start, start.plusMinutes(30), status, canStart));
        }
        return List.copyOf(slots);
    }

    // ------------------------------------------------------------ writes
    @Transactional
    public CourtResponse create(CreateCourtRequest req) {
        requireManager();
        String name = req.name().trim();
        if (courts.existsByNameIgnoreCase(name)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A court named '" + name + "' already exists");
        }
        int duration = req.slotDurationMinutes() != null ? req.slotDurationMinutes() : 60;
        int interval = req.slotIntervalMinutes() != null ? req.slotIntervalMinutes() : 30;
        validateSlotConfig(duration, interval);

        Court court = new Court();
        court.setName(name);
        court.setSport(SportMapper.toDbSport(req.sport()));
        court.setIndoorOutdoor(normaliseIndoorOutdoor(req.indoorOutdoor(), "INDOOR"));
        court.setLocation(req.location());
        court.setSlotDurationMinutes(duration);
        court.setSlotIntervalMinutes(interval);
        court.setActive(true);
        courts.save(court);
        return mapper.toResponse(court);
    }

    @Transactional
    public CourtResponse update(UUID id, UpdateCourtRequest req) {
        requireManager();
        Court court = courts.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + id));

        if (req.name() != null) {
            String name = req.name().trim();
            if (name.isEmpty()) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Name cannot be blank");
            }
            if (courts.existsByNameIgnoreCaseAndIdNot(name, id)) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "A court named '" + name + "' already exists");
            }
            court.setName(name);
        }
        if (req.sport() != null) {
            court.setSport(SportMapper.toDbSport(req.sport()));
        }
        if (req.indoorOutdoor() != null) {
            court.setIndoorOutdoor(normaliseIndoorOutdoor(req.indoorOutdoor(), null));
        }
        if (req.location() != null) {
            court.setLocation(req.location());
        }

        int duration = req.slotDurationMinutes() != null ? req.slotDurationMinutes() : court.getSlotDurationMinutes();
        int interval = req.slotIntervalMinutes() != null ? req.slotIntervalMinutes() : court.getSlotIntervalMinutes();
        validateSlotConfig(duration, interval);
        court.setSlotDurationMinutes(duration);
        court.setSlotIntervalMinutes(interval);

        if (req.active() != null && req.active() != court.isActive()) {
            if (!req.active()) {
                assertNoUpcomingBookings(id);
            }
            court.setActive(req.active());
        }
        courts.save(court);
        return mapper.toResponse(court);
    }

    @Transactional
    public CourtResponse setActive(UUID id, boolean active) {
        requireManager();
        Court court = courts.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + id));
        if (!active && court.isActive()) {
            assertNoUpcomingBookings(id);
        }
        court.setActive(active);
        courts.save(court);
        return mapper.toResponse(court);
    }

    // ----------------------------------------------------------- helpers
    /**
     * The booking engine hard-codes 60-minute sessions on a 30-minute grid, so
     * nothing else is safe to save.
     */
    private static void validateSlotConfig(int duration, int interval) {
        if (duration != 60 || interval != 30) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED,
                    "Only 60-minute sessions with 30-minute slot intervals are supported");
        }
    }

    private static String normaliseIndoorOutdoor(String raw, String fallback) {
        if (raw == null || raw.isBlank()) {
            if (fallback != null) {
                return fallback;
            }
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "indoorOutdoor must be INDOOR or OUTDOOR");
        }
        String v = raw.trim().toUpperCase(Locale.ROOT);
        if (!INDOOR_OUTDOOR.contains(v)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "indoorOutdoor must be INDOOR or OUTDOOR");
        }
        return v;
    }

    private void assertNoUpcomingBookings(UUID courtId) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        long upcoming = bookings.findByCourt_IdAndStartTimeBetween(courtId, now, now.plusDays(400)).stream()
                .filter(b -> "PENDING".equals(b.getStatus()) || "CONFIRMED".equals(b.getStatus()))
                .count();
        if (upcoming > 0) {
            throw new DomainException(ErrorCode.INVALID_STATE,
                    "Court has " + upcoming + " upcoming bookings. Cancel or move them (or use a court block) before deactivating");
        }
    }
}
