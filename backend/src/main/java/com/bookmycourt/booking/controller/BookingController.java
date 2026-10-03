package com.bookmycourt.booking.controller;

import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CancelBookingRequest;
import com.bookmycourt.booking.dto.CourtAvailabilityResponse;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.service.BookingService;
import com.bookmycourt.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @GetMapping("/availability")
    public ApiResponse<List<CourtAvailabilityResponse>> availability(
            @RequestParam(required = false) String sport,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Availability loaded", bookings.availability(sport, date));
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request) {
        return ApiResponse.success("Booking created", bookings.create(request));
    }

    @GetMapping("/bookings/{id}")
    public ApiResponse<BookingResponse> get(@PathVariable UUID id) {
        return ApiResponse.success("Booking loaded", bookings.get(id));
    }

    @GetMapping("/bookings")
    public ApiResponse<List<BookingResponse>> list(@RequestParam UUID memberId) {
        return ApiResponse.success("Bookings loaded", bookings.listForMember(memberId));
    }

    @PatchMapping("/bookings/{id}/confirm")
    public ApiResponse<BookingResponse> confirm(@PathVariable UUID id) {
        return ApiResponse.success("Booking confirmed", bookings.confirm(id));
    }

    @PatchMapping("/bookings/{id}/cancel")
    public ApiResponse<BookingResponse> cancel(
            @PathVariable UUID id,
            @Valid @RequestBody CancelBookingRequest request) {
        return ApiResponse.success("Booking cancelled", bookings.cancel(id, request.reason()));
    }

    @PatchMapping("/bookings/{id}/check-in")
    public ApiResponse<BookingResponse> checkIn(@PathVariable UUID id) {
        return ApiResponse.success("Checked in", bookings.checkIn(id));
    }
}
