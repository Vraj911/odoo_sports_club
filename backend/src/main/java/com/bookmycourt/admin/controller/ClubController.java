package com.bookmycourt.admin.controller;

import com.bookmycourt.admin.dto.ClubPublicResponse;
import com.bookmycourt.admin.service.ClubQueryService;
import com.bookmycourt.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/club", "/api/public/club"})
public class ClubController {

    private final ClubQueryService club;

    public ClubController(ClubQueryService club) {
        this.club = club;
    }

    @GetMapping
    public ApiResponse<ClubPublicResponse> current() {
        return ApiResponse.success("Club loaded", club.current());
    }
}
