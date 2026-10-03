package com.bookmycourt.booking.controller;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CancelBookingRequest;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.service.AvailabilityService;
import com.bookmycourt.booking.service.BookingService;
import com.bookmycourt.booking.service.CourtBlockService;
import com.bookmycourt.booking.service.DayMasks;
import com.bookmycourt.booking.service.OccupancyService;
import com.bookmycourt.common.concurrency.Keys;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookings;
    private final AvailabilityService availabilityService;
    private final CourtBlockService courtBlockService;
    private final CourtRepository courtRepository;
    private final ClubCalendarService clubCalendarService;
    private final OccupancyService occupancyService;

    public BookingController(
            BookingService bookings,
            AvailabilityService availabilityService,
            CourtBlockService courtBlockService,
            CourtRepository courtRepository,
            ClubCalendarService clubCalendarService,
            OccupancyService occupancyService
    ) {
        this.bookings = bookings;
        this.availabilityService = availabilityService;
        this.courtBlockService = courtBlockService;
        this.courtRepository = courtRepository;
        this.clubCalendarService = clubCalendarService;
        this.occupancyService = occupancyService;
    }

    public record CourtBlockRequest(OffsetDateTime start, OffsetDateTime end, String reason, Boolean forceCancel) {

    }

    public record RescheduleBookingRequest(UUID newCourtId, LocalDate newDate, String newStartTime) {

    }

    public record UtilisationResponse(LocalDate from, LocalDate to, double utilisationRate, long totalSlots, long occupiedSlots) {

    }

    @GetMapping("/availability")
    public ApiResponse<List<AvailabilityService.CourtSlotGrid>> availability(
            @RequestParam(required = false) String sport,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Availability loaded", availabilityService.grid(date, sport));
    }

    @GetMapping("/public/availability")
    public ApiResponse<List<AvailabilityService.CourtSlotGrid>> publicAvailability(
            @RequestParam(required = false) String sport,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Public availability loaded", availabilityService.publicGrid(date, sport));
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request) {
        return ApiResponse.success("Booking created", bookings.create(request));
    }

    @PostMapping("/bookings/walk-in")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> walkIn(@Valid @RequestBody CreateBookingRequest request) {
        bookings.assertStaff();
        CreateBookingRequest deskRequest = new CreateBookingRequest(
                request.courtId(),
                request.memberId(),
                request.guestName(),
                request.guestPhone(),
                request.date(),
                request.startTime(),
                "DESK",
                request.paymentPolicy() != null ? request.paymentPolicy() : "PAY_NOW",
                request.overrideCap(),
                request.overrideReason(),
                "WALK_IN"
        );
        return ApiResponse.success("Walk-in booking created", bookings.create(deskRequest));
    }

    @GetMapping("/bookings/{id}")
    public ApiResponse<BookingResponse> get(@PathVariable UUID id) {
        return ApiResponse.success("Booking loaded", bookings.get(id));
    }

    @GetMapping("/bookings")
    public ApiResponse<List<BookingResponse>> list(@RequestParam UUID memberId) {
        return ApiResponse.success("Bookings loaded", bookings.listForMember(memberId));
    }

    // POST is what the SRS lists; PATCH is kept so existing clients keep working.
    @RequestMapping(value = "/bookings/{id}/cancel", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ApiResponse<BookingResponse> cancel(
            @PathVariable UUID id,
            @Valid @RequestBody CancelBookingRequest request) {
        return ApiResponse.success("Booking cancelled", bookings.cancel(id, request.reason()));
    }

    @RequestMapping(value = "/bookings/{id}/reschedule", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ApiResponse<BookingResponse> reschedule(
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleBookingRequest request) {
        LocalTime time;
        try {
            time = LocalTime.parse(request.newStartTime());
        } catch (DateTimeParseException | NullPointerException e) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "newStartTime must be HH:mm");
        }
        return ApiResponse.success("Booking rescheduled", bookings.reschedule(id, request.newCourtId(), request.newDate(), time));
    }

    @RequestMapping(value = "/bookings/{id}/check-in", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ApiResponse<BookingResponse> checkIn(@PathVariable UUID id) {
        return ApiResponse.success("Checked in", bookings.checkIn(id));
    }

    @RequestMapping(value = "/bookings/{id}/no-show", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ApiResponse<BookingResponse> noShow(@PathVariable UUID id) {
        return ApiResponse.success("Marked as no show", bookings.markNoShow(id));
    }

    @RequestMapping(value = "/bookings/{id}/complete", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ApiResponse<BookingResponse> complete(@PathVariable UUID id) {
        return ApiResponse.success("Completed", bookings.complete(id));
    }

    @PostMapping("/courts/{id}/blocks")
    public ApiResponse<CourtBlockService.BlockResult> blockCourt(
            @PathVariable UUID id,
            @RequestBody CourtBlockRequest request) {
        bookings.assertManager();
        boolean force = Boolean.TRUE.equals(request.forceCancel());
        return ApiResponse.success("Court block processed",
                courtBlockService.block(id, request.start(), request.end(), request.reason(), force));
    }

    // date/startSlot/endSlot params from older clients are ignored: the range is read from the stored block.
    @DeleteMapping("/courts/{id}/blocks/{occupancyId}")
    public ApiResponse<Void> unblockCourt(@PathVariable UUID id, @PathVariable UUID occupancyId) {
        bookings.assertManager();
        courtBlockService.unblock(occupancyId, id);
        return ApiResponse.success("Court unblocked", null);
    }

    /**
     * Booked half-hour slots / open half-hour slots, computed from the DB
     * (works for past ranges, no cache pollution).
     */
    @GetMapping("/bookings/utilisation")
    public ApiResponse<UtilisationResponse> utilisation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        bookings.assertManager();
        if (to.isBefore(from)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "'to' must not be before 'from'");
        }
        if (from.plusDays(366).isBefore(to)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Range too large (max 366 days)");
        }

        List<Court> activeCourts = courtRepository.findByActiveTrueOrderByNameAsc();

        OffsetDateTime f = from.atStartOfDay(ClubTime.IST).toOffsetDateTime();
        OffsetDateTime t = to.plusDays(1).atStartOfDay(ClubTime.IST).toOffsetDateTime();
        Map<Keys.CourtDay, Long> occupied = new HashMap<>();
        for (OccupancyService.OccupancyItem item : occupancyService.findActiveBetween(f, t)) {
            LocalDate d = item.startTime().atZoneSameInstant(ClubTime.IST).toLocalDate();
            LocalDate last = DayMasks.lastDay(item.startTime(), item.endTime());
            for (; !d.isAfter(last); d = d.plusDays(1)) {
                occupied.merge(new Keys.CourtDay(item.courtId(), d),
                        DayMasks.mask(item.startTime(), item.endTime(), d), (a, b) -> a | b);
            }
        }

        long total = 0;
        long used = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (clubCalendarService.isClosed(d)) {
                continue;
            }
            long openSlots = SlotMask.range(clubCalendarService.openSlot(d), clubCalendarService.closeSlot(d));
            int perCourt = Long.bitCount(openSlots);
            for (Court court : activeCourts) {
                total += perCourt;
                used += Long.bitCount(occupied.getOrDefault(new Keys.CourtDay(court.getId(), d), 0L) & openSlots);
            }
        }
        double rate = total == 0 ? 0.0 : (double) used / (double) total;
        return ApiResponse.success("Utilisation computed", new UtilisationResponse(from, to, rate, total, used));
    }
}
