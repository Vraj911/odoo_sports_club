package com.bookmycourt.booking.controller;

import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CancelBookingRequest;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.booking.service.AvailabilityService;
import com.bookmycourt.booking.service.BookingService;
import com.bookmycourt.booking.service.CalendarRegistry;
import com.bookmycourt.booking.service.CourtBlockService;
import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookings;
    private final AvailabilityService availabilityService;
    private final CourtBlockService courtBlockService;
    private final CourtRepository courtRepository;
    private final CalendarRegistry calendarRegistry;
    private final ClubCalendarService clubCalendarService;

    public BookingController(
            BookingService bookings,
            AvailabilityService availabilityService,
            CourtBlockService courtBlockService,
            CourtRepository courtRepository,
            CalendarRegistry calendarRegistry,
            ClubCalendarService clubCalendarService
    ) {
        this.bookings = bookings;
        this.availabilityService = availabilityService;
        this.courtBlockService = courtBlockService;
        this.courtRepository = courtRepository;
        this.calendarRegistry = calendarRegistry;
        this.clubCalendarService = clubCalendarService;
    }

    public record CourtBlockRequest(
            OffsetDateTime start,
            OffsetDateTime end,
            String reason,
            Boolean forceCancel
    ) {}

    public record RescheduleBookingRequest(
            UUID newCourtId,
            LocalDate newDate,
            String newStartTime
    ) {}

    public record UtilisationResponse(
            LocalDate from,
            LocalDate to,
            double utilisationRate,
            long totalSlots,
            long occupiedSlots
    ) {}

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

    @PatchMapping("/bookings/{id}/cancel")
    public ApiResponse<BookingResponse> cancel(
            @PathVariable UUID id,
            @Valid @RequestBody CancelBookingRequest request) {
        return ApiResponse.success("Booking cancelled", bookings.cancel(id, request.reason()));
    }

    @PatchMapping("/bookings/{id}/reschedule")
    public ApiResponse<BookingResponse> reschedule(
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleBookingRequest request) {
        LocalTime time = LocalTime.parse(request.newStartTime());
        return ApiResponse.success("Booking rescheduled", bookings.reschedule(id, request.newCourtId(), request.newDate(), time));
    }

    @PatchMapping("/bookings/{id}/check-in")
    public ApiResponse<BookingResponse> checkIn(@PathVariable UUID id) {
        return ApiResponse.success("Checked in", bookings.checkIn(id));
    }

    @PatchMapping("/bookings/{id}/no-show")
    public ApiResponse<BookingResponse> noShow(@PathVariable UUID id) {
        return ApiResponse.success("Marked as no show", bookings.markNoShow(id));
    }

    @PatchMapping("/bookings/{id}/complete")
    public ApiResponse<BookingResponse> complete(@PathVariable UUID id) {
        return ApiResponse.success("Completed", bookings.complete(id));
    }

    @PostMapping("/courts/{id}/blocks")
    public ApiResponse<CourtBlockService.BlockResult> blockCourt(
            @PathVariable UUID id,
            @RequestBody CourtBlockRequest request) {
        boolean force = Boolean.TRUE.equals(request.forceCancel());
        return ApiResponse.success("Court block processed",
                courtBlockService.block(id, request.start(), request.end(), request.reason(), force));
    }

    @DeleteMapping("/courts/{id}/blocks/{occupancyId}")
    public ApiResponse<Void> unblockCourt(
            @PathVariable UUID id,
            @PathVariable UUID occupancyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int startSlot,
            @RequestParam int endSlot) {
        courtBlockService.unblock(occupancyId, id, date, startSlot, endSlot);
        return ApiResponse.success("Court unblocked", null);
    }

    @GetMapping("/bookings/utilisation")
    public ApiResponse<UtilisationResponse> utilisation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Court> activeCourts = courtRepository.findByActiveTrueOrderByNameAsc();
        long totalOpenSlots = 0;
        long occupiedSlots = 0;

        LocalDate curr = from;
        while (!curr.isAfter(to)) {
            long openStarts = clubCalendarService.openStarts(curr);
            int dailyCapacityPerCourt = Long.bitCount(openStarts);

            for (Court court : activeCourts) {
                totalOpenSlots += dailyCapacityPerCourt;
                CourtDayCalendar cal = calendarRegistry.get(court.getId(), curr);
                long occ = (cal.bookedMask() | cal.socialMask()) & openStarts;
                occupiedSlots += Long.bitCount(occ);
            }
            curr = curr.plusDays(1);
        }

        double rate = totalOpenSlots == 0 ? 0.0 : (double) occupiedSlots / (double) totalOpenSlots;
        return ApiResponse.success("Utilisation computed",
                new UtilisationResponse(from, to, rate, totalOpenSlots, occupiedSlots));
    }
}
