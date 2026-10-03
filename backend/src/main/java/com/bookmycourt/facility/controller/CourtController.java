package com.bookmycourt.facility.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.facility.dto.CourtResponse;
import com.bookmycourt.facility.service.CourtService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ApiResponse<List<CourtResponse>> list(@RequestParam(required = false) String sport) {
        return ApiResponse.success("Courts loaded", courts.list(sport));
    }

    @GetMapping("/{id}")
    public ApiResponse<CourtResponse> get(@PathVariable UUID id) {
        return ApiResponse.success("Court loaded", courts.get(id));
    }
}
