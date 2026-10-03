package com.bookmycourt.facility.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.facility.dto.CourtResponse;
import com.bookmycourt.facility.dto.CreateCourtRequest;
import com.bookmycourt.facility.dto.SlotDto;
import com.bookmycourt.facility.dto.UpdateCourtRequest;
import com.bookmycourt.facility.service.CourtService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courts")
public class CourtController {

    private final CourtService courts;

    public CourtController(CourtService courts) {
        this.courts = courts;
    }

    @GetMapping
    public ApiResponse<List<CourtResponse>> list(
            @RequestParam(required = false) String sport,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        return ApiResponse.success("Courts loaded", courts.list(sport, includeInactive));
    }

    @GetMapping("/{id}")
    public ApiResponse<CourtResponse> get(@PathVariable UUID id) {
        return ApiResponse.success("Court loaded", courts.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CourtResponse> create(@Valid @RequestBody CreateCourtRequest req) {
        return ApiResponse.success("Court created", courts.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<CourtResponse> update(@PathVariable UUID id, @RequestBody UpdateCourtRequest req) {
        return ApiResponse.success("Court updated", courts.update(id, req));
    }

    @PatchMapping("/{id}/active")
    public ApiResponse<CourtResponse> setActive(@PathVariable UUID id, @RequestParam boolean active) {
        return ApiResponse.success("Court status updated", courts.setActive(id, active));
    }

    @GetMapping("/{id}/slots")
    public ApiResponse<List<SlotDto>> getSlots(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Slots loaded", courts.getSlots(id, date));
    }
}
